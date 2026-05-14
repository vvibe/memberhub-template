# Substack / Skool Competitive Feature Check

Research date: 2026-05-14

Purpose: confirm MemberHub covers the baseline functions builders expect from a "Substack + Patreon + Skool" style product.

## Research Sources

Official / primary sources used:

- Substack paid publication setup: https://support.substack.com/hc/en-us/articles/360037459952-How-do-I-set-up-a-paid-publication
- Substack reader subscription plans: https://support.substack.com/hc/en-us/articles/360037830631-How-do-readers-subscribe-to-my-Substack-publication
- Substack Chat: https://support.substack.com/hc/en-us/articles/10409888763668-How-do-I-enable-Chat-on-my-Substack
- Substack metrics: https://support.substack.com/hc/en-us/articles/5320347155860-A-guide-to-Substack-metrics
- Substack podcast publishing: https://support.substack.com/hc/en-us/articles/360037462092-How-do-I-create-and-publish-a-podcast-on-Substack
- Substack Live Video: https://support.substack.com/hc/en-us/articles/30316077882516-Getting-started-with-Live-Video-on-Substack
- Substack referral program: https://support.substack.com/hc/en-us/articles/8946512015892-Does-Substack-have-a-referral-program
- Skool Help Center categories: https://help.skool.com/
- Skool pricing models: https://help.skool.com/article/215-how-to-setup-pricing-for-the-group
- Skool points and levels: https://help.skool.com/article/183-how-do-points-and-level-work
- Skool payment FAQs: https://help.skool.com/article/86-subscriptions-faq
- Skool Classroom: https://help.skool.com/article/166-what-is-classroom
- Skool moderation / AutoMod: https://help.skool.com/article/184-how-to-manage-spam-in-your-skool-community
- Skool member roles: https://help.skool.com/article/74-member-roles
- Skool community categories: https://help.skool.com/article/67-how-to-setup-categories

## Conclusion

MemberHub's implemented demo and product spec cover the baseline product surface of Substack and Skool:

- Substack baseline: publishing, email/newsletter delivery, free/paid subscriptions, paid previews, chat/community, subscriber dashboard, metrics, podcast/video/live content, referral/gift growth, and source tracking.
- Skool baseline: community, classroom/courses/resources, calendar/events, gamification, global search, member directory, roles/admin/moderation, pricing plans, member self-service, and payment/receipt lifecycle.

Two areas are intentionally not cloned as first-party platform network effects:

- Substack recommendation/app network.
- Skool discovery/affiliate network.

MemberHub should provide self-hosted equivalents instead: referral codes, source attribution, share links, promo codes, GA4/Portaly analytics, and optional affiliate/referral payout tables.

## Feature Matrix

| Baseline function | Substack | Skool | MemberHub coverage |
| --- | --- | --- | --- |
| Public content publishing | Posts, newsletters, web publication | Posts inside groups | `content_items`, public preview pages, admin content manager |
| Email/newsletter delivery | Core email delivery and app inbox | Broadcast/group updates | `newsletter_issues`, Email/LINE/in-app notification adapter, issue archive UI |
| Free members/subscribers | Free subscription plan | Free group/freemium | Free membership plan |
| Paid subscriptions | Monthly, annual, founding member | Subscription, freemium, tiered pricing | Monthly, yearly, lifetime, free, tiered plans via `plans` and Portaly checkout |
| One-time/lifetime purchase | Not the primary Substack model | One-time payment supported | Lifetime plan and one-time product support |
| Paywall/free preview | Paid posts, paid audio/video previews | Paid group/tier access | Paywall rules on content/media/lessons |
| Course/classroom | Not core | Classroom, resources, transcripts, unlock mechanisms | `courses`, `lessons`, `course_resources`, transcripts, pinned lesson discussions, level unlocks |
| Community discussions | Chat and comments | Community posts/comments/categories | Threads, comments, categories, permissions, pinned posts, moderation |
| Search | Publication/app search varies by context | Group search and searchable transcripts | Global search across posts, newsletter, courses, lesson transcripts, threads, members, events |
| Member profiles | Substack profiles | Group member profiles | Member directory, profiles, roles, level, contributions, source, risk state |
| Reactions/likes | Likes/comments/shares in metrics | Likes create points | `reactions` and `member_points` |
| Gamification | Not core | Points, levels, leaderboards | Points, levels, leaderboards, unlock state |
| Calendar/events/live | Live video and event-like posts | Calendar, Skool Call, Go Live | `events`, audience gates, webinar/live/calendar/replay model |
| Podcast/audio/video | Podcast, video posts, live video | Course video/content embeds | `media_items`, paid previews, replays |
| Subscriber/member dashboard | Subscriber list, stats, export | Members/admin views | Admin member dashboard, CSV export, source metrics |
| Analytics/growth source | Post stats, growth/source reporting | Traffic sources and admin insights | `subscriber_metrics`, Portaly Vibe, GA4 events |
| Payment lifecycle | Stripe Connect, creator-controlled payment relationship | Native payments, receipts, self-service | Portaly hosted checkout, callback verification, payment events |
| Receipts/invoices | Payment records via Stripe/Substack flow | Receipts and purchase history | Receipt/invoice status records and invoice task table |
| Member self-service | Subscriber account settings | Update payment, receipts, cancel subscription | Portaly portal/session integration and local status records |
| Roles/admin/moderation | Publication admins and subscriber controls | Owner/admin/mod/billing manager, membership questions, AutoMod | Group roles, membership questions, reports, AutoMod-risk queue, billing dispute queue |
| Referrals/discovery | Recommendations, source tracking, gift referrals | Discovery and affiliate/referrals | Referral codes, subscriber gifts, campaign sources, promo codes; platform network not cloned |

## Required MemberHub Baseline

To be considered feature-complete against Substack and Skool basics, a MemberHub implementation should include:

- Public content pages with free previews and paid locks.
- Free, monthly, yearly, lifetime, and tiered plans.
- Portaly hosted checkout integration, starting with test mode.
- Payment callback verification and idempotent fulfillment.
- Receipt/invoice status or invoice task records.
- Member self-service entry point for plan, receipts/invoices, payment method, and cancellation.
- Course progress and optional level-gated lessons.
- Community categories, permissions, moderation, comments, replies, and reactions.
- Points, levels, and leaderboards.
- Events/calendar, webinar/live sessions, and replay records.
- Email/LINE/in-app notifications.
- Subscriber/member dashboard with source attribution and export.
- Search across content, courses, discussions, comments, and members.
- Member directory/profile pages with roles, levels, contributions, and acquisition source.
- Membership questions, report queue, AutoMod-risk queue, and moderator/admin role handling.
- Course resources, transcripts, and pinned lesson discussion links.
- Referral codes, paid subscriber gift campaigns, and source/campaign attribution.
- Portaly Vibe product optimization, member sync, analytics, and security status.

## Implemented Demo Coverage Added on 2026-05-14

- Added `newsletter` view for scheduled issues, segment status, Email/LINE/in-app notification adapters, and paid conversions.
- Added `search` view for global search across content, newsletters, courses, lessons, transcripts, discussion threads, members, and events.
- Added `members` view for Skool-style member directory, profile summary, group role, level, points, contribution count, source, and risk state.
- Expanded `courses` view with course resources, transcripts, and pinned lesson discussion indicators.
- Expanded `admin` view with newsletter operations, referral/gift campaigns, moderation queue, AutoMod-risk state, and growth attribution.
- Expanded InsForge schema with `newsletter_issues`, `media_items`, `course_resources`, `member_points`, `notifications`, `moderation_items`, and `membership_questions`.

## Product Decision

MemberHub should not promise to recreate Substack's app-level discovery graph or Skool's platform marketplace in v1. Those require network liquidity, not just app features.

Instead, v1 should ship the primitives that make a self-hosted creator business usable by the operator and clear to their members, students, readers, or subscribers:

- Referral codes and campaign sources.
- Discount codes.
- Share URLs.
- Subscriber source attribution.
- GA4/Portaly analytics events.
- Optional affiliate/referral ledger for agencies or creators.
