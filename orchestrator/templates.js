// templates.js
// Drop-in expansion: 70+ dealership scenarios.
// These tokens are filled by orchestrator/index.js via render().
// Common tokens you can pass in req.body -> /respond:
//   [[name]]             // lead first name or "there"
//   [[agent]]            // agent name (e.g., "Alex")
//   [[store]]            // store name (e.g., "Quirk Nashua")
//   [[model_trim]]       // "2025 Chevrolet Traverse LT"
//   [[stock_count]]      // integer
//   [[primary_photo]]    // URL
//   [[vin]]              // VIN
//   [[stock_number]]     // Stock ID
//   [[price]]            // Number
//   [[msrp]]             // Number
//   [[slot1]], [[slot2]] // e.g., "6:15 PM", "10:30 AM"
//   [[incentive_line]]   // optional line if incentives present
//
// Extra tokens some templates may use (safe to omit if unknown):
//   [[appointment_date]], [[appointment_time]], [[location]]
//   [[alt_vehicle]], [[payment_estimate]], [[apr]], [[term]]
//   [[trade_estimate_low]], [[trade_estimate_high]], [[payoff]]
//   [[eta_date]], [[order_number]], [[deposit_amount]]
//   [[event_name]], [[event_day]], [[weather_note]]
//   [[lease_end_date]], [[mileage_allowance]], [[buyout_amount]]
//   [[doc_list]], [[short_link]], [[manager]]
//
// Usage: templates[intentKey] -> { email, sms }

export const templates = {
  /* === CORE LEAD FLOWS ==================================================== */
  new_internet_lead: {
    email: `
Hi [[name]],

Thanks for reaching out to [[store]]! I’m [[agent]]. Based on your note, the [[model_trim]] is a great fit.

[[incentive_line]]

Quick next steps:
• Reserve a time today at [[slot1]] or tomorrow at [[slot2]]
• I can send a tailored out-the-door estimate ahead of time
• Photos/specs: [[primary_photo]]

Want me to lock the vehicle (VIN [[vin]], stock [[stock_number]]) on a no-obligation hold?

— [[agent]], [[store]]
    `,
    sms: `Hey [[name]] — it’s [[agent]] at [[store]]. The [[model_trim]] you asked about is available. [[incentive_line]] Want to stop by [[slot1]] or [[slot2]]?`
  },

  best_price: {
    email: `
Hi [[name]],

You asked for our best price on [[model_trim]]. Today we’re at $[[price]] (MSRP $[[msrp]]). [[incentive_line]]

I can also show a payment preview (e.g., [[payment_estimate]] at [[apr]]% for [[term]] mos) and any comparable units to help you choose.

Would [[slot1]] or [[slot2]] work for a quick look?

— [[agent]], [[store]]
    `,
    sms: `[[name]], best price on [[model_trim]] is $[[price]] (MSRP $[[msrp]]). [[incentive_line]] Want to pop in [[slot1]] or [[slot2]]? — [[agent]]`
  },

  trade_inquiry: {
    email: `
Hi [[name]],

We can get you a fast trade range. If you share miles and VIN (or a few photos), I’ll send a preliminary value today. Typical range looks like $[[trade_estimate_low]]–$[[trade_estimate_high]] pending condition.

Bring it by [[slot1]] or [[slot2]] for a 10-minute drive-through appraisal?

— [[agent]], [[store]]
    `,
    sms: `We can pre-value your trade at [[store]]. Likely $[[trade_estimate_low]]–$[[trade_estimate_high]] pending condition. Swing by [[slot1]] or [[slot2]]? — [[agent]]`
  },

  test_drive_set: {
    email: `
Hi [[name]],

You’re set for a test drive on [[appointment_date]] at [[appointment_time]] for the [[model_trim]]. I’ll have it fueled and up front. If plans change, reply here and we’ll adjust.

See you soon at [[store]] — ask for [[agent]].

— [[agent]]
    `,
    sms: `Reminder: [[appointment_time]] [[appointment_date]] test drive for [[model_trim]] at [[store]]. Reply to adjust. — [[agent]]`
  },

  test_drive_reminder_same_day: {
    email: `
Hi [[name]],

Looking forward to your visit today at [[appointment_time]] for the [[model_trim]]. I’ll text if anything changes on our side.

— [[agent]], [[store]]
    `,
    sms: `See you today at [[appointment_time]] for [[model_trim]] at [[store]]. Text me if you’re running late. — [[agent]]`
  },

  no_show_recovery: {
    email: `
Hi [[name]],

We missed you earlier. All good — happens to all of us. Want to reschedule your quick drive in the [[model_trim]]? I can hold [[slot1]] or [[slot2]].

If it’s easier, I can also send a full walkaround video or alternative options.

— [[agent]], [[store]]
    `,
    sms: `Sorry we missed you. Want to reschedule the [[model_trim]] drive? [[slot1]] or [[slot2]] work. — [[agent]]`
  },

  post_test_drive_followup: {
    email: `
Hi [[name]],

Thanks for driving the [[model_trim]]. What stood out — and what didn’t? If you want, I’ll tighten pricing and payments, and compare it to [[alt_vehicle]] side-by-side.

I can also send a quick out-the-door worksheet for review.

— [[agent]], [[store]]
    `,
    sms: `Thanks for stopping in! Want me to send an out-the-door on [[model_trim]] or compare against [[alt_vehicle]]? — [[agent]]`
  },

  /* === APPOINTMENT / SCHEDULING ========================================== */
  appt_confirm: {
    email: `
Hi [[name]],

Your visit is confirmed for [[appointment_date]] at [[appointment_time]] (ask for [[agent]]). I’ll have the [[model_trim]] ready.

Need directions or to adjust timing?

— [[agent]], [[store]]
    `,
    sms: `Confirmed [[appointment_time]] [[appointment_date]] at [[store]]. Ask for [[agent]].`
  },

  appt_reminder_24h: {
    email: `
Hi [[name]],

Quick reminder for tomorrow’s visit at [[appointment_time]]. I’ll keep [[model_trim]] parked up front.

— [[agent]], [[store]]
    `,
    sms: `Reminder: tomorrow [[appointment_time]] at [[store]] for [[model_trim]]. — [[agent]]`
  },

  appt_reschedule_offer: {
    email: `
Hi [[name]],

If timing got tight, no worries. I can offer [[slot1]] or [[slot2]] or meet you halfway with a walkaround video and pricing desk.

Which works best?

— [[agent]], [[store]]
    `,
    sms: `Want to move your time? [[slot1]] or [[slot2]] are open. — [[agent]]`
  },

  /* === PRICING / INVENTORY SIGNALS ======================================= */
  price_drop_alert: {
    email: `
Hi [[name]],

Heads up: [[model_trim]] just dropped to $[[price]]. [[incentive_line]]

Do you want me to place a courtesy 24-hour hold?

— [[agent]], [[store]]
    `,
    sms: `Price update: [[model_trim]] now $[[price]]. Hold it for 24 hrs? — [[agent]]`
  },

  unit_aging_push: {
    email: `
Hi [[name]],

We’ve got a few [[model_trim]] units aging on the lot, and management authorized more aggressive pricing this week only.

If you’re open to a quick call, I’ll send you our best figure before you come in.

— [[agent]], [[store]]
    `,
    sms: `Manager special on [[model_trim]] this week. Want me to text the figure? — [[agent]]`
  },

  alt_vehicle_sold_suggestion: {
    email: `
Hi [[name]],

That exact VIN is now sold, but I’ve got [[stock_count]] similar units and one close match: [[alt_vehicle]].

Do you want photos and an updated worksheet to compare?

— [[agent]], [[store]]
    `,
    sms: `That VIN just sold, but I have alternatives incl. [[alt_vehicle]]. Want details? — [[agent]]`
  },

  inbound_allocation: {
    email: `
Hi [[name]],

I can allocate an inbound [[model_trim]] that matches your build. ETA [[eta_date]]. A small refundable [[deposit_amount]] holds it in your name.

Want me to send the build sheet?

— [[agent]], [[store]]
    `,
    sms: `We can tag an inbound [[model_trim]] (ETA [[eta_date]]). Hold w/ [[deposit_amount]] refundable deposit? — [[agent]]`
  },

  /* === FINANCE / CREDIT / DOCS =========================================== */
  finance_preapproved: {
    email: `
Hi [[name]],

Good news — you’re pre-approved. If you share a target payment or down amount, I’ll tailor the terms.

Bring your license and proof of insurance; I’ll have the buyer’s order ready.

— [[agent]], [[store]]
    `,
    sms: `You’re pre-approved. Want me to tailor payments to your budget and down? — [[agent]]`
  },

  finance_more_info_needed: {
    email: `
Hi [[name]],

The lender needs a bit more info to finalize. Could you provide: [[doc_list]]?

As soon as I have that, I’ll update you on final terms.

— [[agent]], [[store]]
    `,
    sms: `Need a couple docs for the lender: [[doc_list]]. Send when ready and I’ll finalize. — [[agent]]`
  },

  finance_soft_approval_next_steps: {
    email: `
Hi [[name]],

We’ve got a soft approval pathway. If you’re good with a quick confirm call, I can lock terms and hold the [[model_trim]].

What time works today?

— [[agent]], [[store]]
    `,
    sms: `Soft path looks good. Quick call to lock terms & hold the car? — [[agent]]`
  },

  finance_declined_soften: {
    email: `
Hi [[name]],

I know that wasn’t the outcome we hoped for. We do have alternative lenders and a path with a slightly larger down or different model. If you’re open, I can map options and payments to keep this moving.

I’m here to help — no pressure.

— [[agent]], [[store]]
    `,
    sms: `Let’s review alternative lenders / vehicles to fit the budget. I can map options. — [[agent]]`
  },

  documents_needed_before_delivery: {
    email: `
Hi [[name]],

Ahead of delivery we’ll need: [[doc_list]]. If you send photos today, I’ll pre-load everything so your pickup is quick.

Reply with any questions.

— [[agent]], [[store]]
    `,
    sms: `For delivery we’ll need: [[doc_list]]. Send pics and I’ll prep your file. — [[agent]]`
  },

  esign_ready: {
    email: `
Hi [[name]],

Your e-sign packet is ready. Use this secure link: [[short_link]].
If you prefer, we can sign in person during pickup.

— [[agent]], [[store]]
    `,
    sms: `E-sign is ready: [[short_link]] (secure). Prefer in-store? — [[agent]]`
  },

  /* === TRADE / EQUITY / SERVICE-TO-SALES ================================= */
  equity_mining_outreach: {
    email: `
Hi [[name]],

Looks like you’re in a strong equity position. If you’re curious, I can show your buy-out and what it would look like to swap keys with little or no payment change.

Want me to run the numbers?

— [[agent]], [[store]]
    `,
    sms: `You may have strong equity. Want me to run a swap-keys scenario for you? — [[agent]]`
  },

  service_to_sales_upgrade: {
    email: `
Hi [[name]],

While you’re in for service, we can appraise your vehicle and show options that keep your payment near where it is now (or lower). Takes 10 minutes while you wait.

Interested?

— [[agent]], [[store]]
    `,
    sms: `While you’re here for service, want a 10-min upgrade appraisal? — [[agent]]`
  },

  recall_outreach: {
    email: `
Hi [[name]],

There’s an open recall on your vehicle. We can book service and, if you like, review upgrade options while you’re here.

Want me to schedule something?

— [[agent]], [[store]]
    `,
    sms: `Open recall noted. Want me to book a visit and review options? — [[agent]]`
  },

  trade_offer_increase: {
    email: `
Hi [[name]],

Management approved a stronger number on your trade this week. If you can swing by [[slot1]] or [[slot2]], I’ll re-appraise and send a firm figure.

— [[agent]], [[store]]
    `,
    sms: `We can increase your trade offer this week. Quick re-appraisal [[slot1]] or [[slot2]]? — [[agent]]`
  },

  payoff_quote_needed: {
    email: `
Hi [[name]],

To finalize your trade, we’ll need your payoff quote (good-through date and lender). If you share that, I’ll update the numbers and payment.

— [[agent]], [[store]]
    `,
    sms: `Need your payoff quote (lender + good-through date) to finalize. — [[agent]]`
  },

  /* === LEASE / ORDER / SPECIALTY ========================================= */
  lease_quote_request: {
    email: `
Hi [[name]],

Here’s a sample lease on [[model_trim]]: [[mileage_allowance]] mi/yr, [[term]] mos, with $[[price]] cap cost (subject to programs). If you share miles and usage, I’ll dial in the right structure.

Want [[slot1]] or [[slot2]] to review?

— [[agent]], [[store]]
    `,
    sms: `I can tailor a lease on [[model_trim]] (miles/term). Want to review [[slot1]] or [[slot2]]? — [[agent]]`
  },

  lease_end_buyout_path: {
    email: `
Hi [[name]],

Lease end is approaching ([[lease_end_date]]). We can quote your buy-out (~$[[buyout_amount]]) and compare a pull-ahead into a newer model with similar payment.

Want me to map options?

— [[agent]], [[store]]
    `,
    sms: `Lease end near [[lease_end_date]]. Want buy-out vs. pull-ahead options? — [[agent]]`
  },

  lease_pull_ahead_event: {
    email: `
Hi [[name]],

We’ve got a pull-ahead window open — waive some remaining payments and move into a newer [[model_trim]]. Could lower your total cost if miles are climbing.

Want details?

— [[agent]], [[store]]
    `,
    sms: `Pull-ahead available on your lease. Want details? — [[agent]]`
  },

  factory_order_status: {
    email: `
Hi [[name]],

Your order [[order_number]] is tracking on schedule. Current ETA: [[eta_date]]. I’ll notify you with any changes and get delivery paperwork ready in advance.

— [[agent]], [[store]]
    `,
    sms: `Order [[order_number]] ETA [[eta_date]]. I’ll keep you posted. — [[agent]]`
  },

  deposit_request_hold: {
    email: `
Hi [[name]],

We can place a refundable [[deposit_amount]] hold on [[model_trim]] so no one else grabs it while you finalize details. Good for 48 hours.

Want me to send the secure link?

— [[agent]], [[store]]
    `,
    sms: `I can hold [[model_trim]] for 48h with a refundable [[deposit_amount]] deposit. Send link? — [[agent]]`
  },

  /* === EVENTS / MARKETING ================================================= */
  event_invite: {
    email: `
Hi [[name]],

You’re invited to [[event_name]] at [[store]] this [[event_day]]. We’ll have one-day pricing on [[model_trim]] and instant appraisals.

Can I pencil you in for [[slot1]] or [[slot2]]?

— [[agent]]
    `,
    sms: `Invite: [[event_name]] this [[event_day]] at [[store]]. Want [[slot1]] or [[slot2]]? — [[agent]]`
  },

  end_of_month_urgency: {
    email: `
Hi [[name]],

End-of-month programs end soon. If we button this up by [[event_day]], I can maximize incentives on [[model_trim]].

Five minutes on the phone or swing by [[slot1]]/[[slot2]]?

— [[agent]], [[store]]
    `,
    sms: `Month-end programs wrap soon. Want me to maximize incentives on [[model_trim]]? — [[agent]]`
  },

  holiday_sale_push: {
    email: `
Hi [[name]],

Holiday pricing is live on [[model_trim]] this week only. If we secure it now, I’ll hold your number even if inventory tightens.

Do you want a one-page summary?

— [[agent]], [[store]]
    `,
    sms: `Holiday pricing on [[model_trim]] this week only. Want the one-pager? — [[agent]]`
  },

  /* === DELIVERY / LOGISTICS ============================================== */
  home_delivery_option: {
    email: `
Hi [[name]],

If it’s easier, we can handle paperwork online and deliver [[model_trim]] to your home/work. I’ll pre-load docs so it’s quick on your schedule.

Interested in delivery or store pickup?

— [[agent]], [[store]]
    `,
    sms: `We can deliver [[model_trim]] and e-sign. Prefer delivery or pickup? — [[agent]]`
  },

  pickup_scheduling: {
    email: `
Hi [[name]],

Let’s schedule pickup. I can do [[slot1]] or [[slot2]]. Bring your license/insurance; I’ll have plates and temp tag ready.

— [[agent]], [[store]]
    `,
    sms: `Pickup: [[slot1]] or [[slot2]] at [[store]]? — [[agent]]`
  },

  we_owe_update: {
    email: `
Hi [[name]],

Quick update on your We-Owe items: [[doc_list]]. I’ll message you as each one is ready or if we can handle them during your first service visit.

— [[agent]], [[store]]
    `,
    sms: `We-Owe update: [[doc_list]]. I’ll ping you as each is ready. — [[agent]]`
  },

  /* === EV / ACCESSORIES / PROTECTION ===================================== */
  ev_tax_credit_info: {
    email: `
Hi [[name]],

If you’re considering an EV, I can check eligibility for potential credits and share a home-charger guide. For [[model_trim]], we’ve delivered a bunch recently and can outline charging costs vs. fuel.

Want a quick rundown?

— [[agent]], [[store]]
    `,
    sms: `I can check EV credit eligibility + charger options for [[model_trim]]. Want details? — [[agent]]`
  },

  charger_install_options: {
    email: `
Hi [[name]],

Here’s a quick primer on home charging plus vetted installers. If you’d like introductions, I’ll connect you and share typical timelines/costs.

— [[agent]], [[store]]
    `,
    sms: `Want a vetted charger installer intro? Happy to connect you. — [[agent]]`
  },

  accessories_upsell: {
    email: `
Hi [[name]],

Popular add-ons for [[model_trim]] include all-weather mats, bed/roof accessories, and cargo protection. If you want, I’ll bundle them into your out-the-door so it’s one easy step.

— [[agent]], [[store]]
    `,
    sms: `Want me to bundle accessories (mats, roof/bed, cargo) with your [[model_trim]]? — [[agent]]`
  },

  protection_plan_upsell: {
    email: `
Hi [[name]],

If you’re keeping the vehicle beyond factory warranty, a service contract can save surprise costs. I can show a version that fits your miles and budget, plus GAP options if you finance.

Want the side-by-side?

— [[agent]], [[store]]
    `,
    sms: `Want a quick side-by-side on protection plans/GAP? — [[agent]]`
  },

  winter_tires_package: {
    email: `
Hi [[name]],

Heading into winter, many [[model_trim]] owners add a wheel/tire package. I can quote a mounted set and storage if you want seasonal swaps.

— [[agent]], [[store]]
    `,
    sms: `Want a winter wheel/tire quote for your [[model_trim]]? — [[agent]]`
  },

  /* === RECOVERY / NURTURE ================================================= */
  cold_lead_30d: {
    email: `
Hi [[name]],

Still in the market? If anything changed (budget, timing, model), I’ll adjust recommendations. We also had a few price moves on [[model_trim]].

Want me to refresh options?

— [[agent]], [[store]]
    `,
    sms: `Still shopping? I can refresh options/pricing for you. — [[agent]]`
  },

  cold_lead_90d: {
    email: `
Hi [[name]],

Just checking in. If you purchased elsewhere, congrats! If not, I’d be happy to help you compare updated programs or look at certified pre-owned.

Want me to put together a quick sheet?

— [[agent]], [[store]]
    `,
    sms: `No rush — if you’re still looking, I can build a quick options sheet. — [[agent]]`
  },

  website_abandon_recover: {
    email: `
Hi [[name]],

I noticed you were building a deal on [[model_trim]] but didn’t finish. If you want, I can complete it for you and send the summary to review.

Should I finalize and send?

— [[agent]], [[store]]
    `,
    sms: `Want me to finish your [[model_trim]] deal online and send the summary? — [[agent]]`
  },

  chat_handoff_followup: {
    email: `
Hi [[name]],

Thanks for chatting with our online assistant. I’m a real person on the team 👋 — I’ll be your single point of contact. Do you prefer text or email for updates?

— [[agent]], [[store]]
    `,
    sms: `I’m [[agent]] (human) from [[store]]. Prefer text or email going forward?`
  },

  competitor_quote_counter: {
    email: `
Hi [[name]],

If you received another quote, I’m happy to compare apples-to-apples (fees, doc, add-ons) and match/beat where possible. Shoot it over and I’ll mark up deltas.

— [[agent]], [[store]]
    `,
    sms: `Send the other quote and I’ll mark up the differences — can likely match/beat. — [[agent]]`
  },

  negative_response_soft_close: {
    email: `
Hi [[name]],

I’ll step back for now. If the timing changes or you just want quick numbers, I’m one message away. I’ll keep an eye out for price moves on [[model_trim]] for you.

Thank you for the opportunity!

— [[agent]], [[store]]
    `,
    sms: `Totally fine to pause. Ping me anytime — I’ll watch for price moves on [[model_trim]]. — [[agent]]`
  },

  do_not_contact_confirm: {
    email: `
Understood, [[name]] — I’ve marked your preferences as Do Not Contact. If that changes, reply “resume” and I’ll be here to help.

— [[agent]], [[store]]
    `,
    sms: `You’re set to Do Not Contact. Reply “resume” anytime. — [[agent]]`
  },

  /* === WEATHER / STORE OPS =============================================== */
  weather_closure: {
    email: `
Hi [[name]],

Due to weather, our showroom is operating limited hours today ([[weather_note]]). I’m happy to handle video walkarounds or remote paperwork.

Would you like to reschedule to [[slot1]] or [[slot2]]?

— [[agent]], [[store]]
    `,
    sms: `Weather update: limited hours today. Want to shift to [[slot1]] or [[slot2]]? — [[agent]]`
  },

  /* === POST-SALE / CSI / REFERRALS ======================================= */
  post_sale_thankyou: {
    email: `
Hi [[name]],

Congrats and thank you from all of us at [[store]]! If anything feels off during the first week, message me and I’ll jump on it.

Enjoy your [[model_trim]] — and welcome to the family.

— [[agent]]
    `,
    sms: `Thank you from [[store]]! Ping me if you need anything with your [[model_trim]]. — [[agent]]`
  },

  csi_survey_nudge: {
    email: `
Hi [[name]],

You may see a brief survey from the manufacturer. If we earned 10/10, that feedback really helps our team. If not, please tell me what to fix — I’ll make it right.

— [[agent]], [[store]]
    `,
    sms: `If we earned it, a 10/10 on the survey really helps. If not, tell me and I’ll fix it. — [[agent]]`
  },

  referral_request: {
    email: `
Hi [[name]],

If friends or coworkers mention they’re shopping, I’d be grateful for an intro. I’ll treat them like VIPs — no pressure, just options.

Thanks again!

— [[agent]], [[store]]
    `,
    sms: `Know someone shopping? I’ll take great care of them — appreciate any intro. — [[agent]]`
  },

  loyalty_program_invite: {
    email: `
Hi [[name]],

I can enroll you in our loyalty program (service discounts, priority scheduling, event invites). It’s free; takes 30 seconds.

Want me to add you?

— [[agent]], [[store]]
    `,
    sms: `Want loyalty perks (free)? I can enroll you now. — [[agent]]`
  },

  /* === MANAGER / TEAM HANDOFFS =========================================== */
  manager_intro: {
    email: `
Hi [[name]],

Looping in [[manager]], our sales manager, to help fast-track numbers and availability on [[model_trim]]. We’ll tag-team so you get answers quickly.

— [[agent]], [[store]]
    `,
    sms: `Adding my manager [[manager]] to fast-track numbers/availability. — [[agent]]`
  },

  /* === MISC GUARD TEMPLATES ============================================== */
  generic_checkin: {
    email: `
Hi [[name]],

Just checking in — any questions I can answer on [[model_trim]] or timing? I’m here to help, no pressure.

— [[agent]], [[store]]
    `,
    sms: `Any questions I can answer on [[model_trim]]? Happy to help. — [[agent]]`
  },

  out_of_state_buyer: {
    email: `
Hi [[name]],

We work with out-of-state buyers all the time. I’ll handle temp tags, paperwork shipping/e-sign, and delivery options so you don’t have to travel twice.

Want me to outline steps and taxes/fees by state?

— [[agent]], [[store]]
    `,
    sms: `Out-of-state is easy — I’ll outline steps and delivery. Want details? — [[agent]]`
  },

  spanish_language_offer: {
    email: `
Hola [[name]],

Contamos con personal que habla español para asistirle con [[model_trim]], precios y financiamiento. ¿Prefiere continuar en español?

— [[agent]], [[store]]
    `,
    sms: `Podemos continuar en español si prefiere. — [[agent]]`
  }
};
