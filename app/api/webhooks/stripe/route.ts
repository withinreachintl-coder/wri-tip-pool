import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const customerId = session.customer as string
    if (!customerId) return NextResponse.json({ received: true })

    const { data: org, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!error && org) {
      await supabase.from('organizations').update({
        subscription_status: 'active',
        subscription_tier: 'pro',
        subscription_end_date: null,
        stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
      }).eq('id', org.id)
      console.log(`✅ Pro activated for org ${org.id}`)
    } else {
      // No customer match yet — store by owner_email if available
      if (session.customer_details?.email) {
        await supabase.from('organizations')
          .update({
            subscription_status: 'active',
            subscription_tier: 'pro',
            subscription_end_date: null,
            stripe_customer_id: customerId,
          })
          .eq('owner_email', session.customer_details.email)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string
    if (!customerId) return NextResponse.json({ received: true })

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (org) {
      await supabase.from('organizations').update({
        subscription_status: 'canceled',
        subscription_tier: 'free',
        subscription_end_date: new Date().toISOString(),
      }).eq('id', org.id)
      console.log(`❌ Subscription canceled for org ${org.id}`)
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
