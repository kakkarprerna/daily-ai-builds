// Three worked examples with saved results, so visitors can see the app
// work without a model call. Scenarios are invented and anonymised.

export const EXAMPLES = [
  {
    id: 'emails',
    title: 'Order emails never arrive',
    blurb: 'Confirmation emails send on staging. In production, customers get nothing.',
    tag: 'Webhook',
    input: {
      symptom:
        'After a customer pays, they should get an order confirmation email. On staging the email arrives within a minute every time. In production nobody has received one since launch, but the orders themselves are saved correctly.',
      worksIn: 'Staging',
      failsIn: 'Production',
      failureKind: 'Integration not firing',
      affected: 'Everyone',
      started: 'Since first deploy to that environment',
      checked: ['Same build version in both', 'Checked error logs'],
      notes: 'Error logs in production show nothing at all for the email step, not even a failure. The payment provider dashboard shows payments succeeding.',
    },
    result: `VERDICT: Third-party
CONFIDENCE: High
SUMMARY: The email is most likely triggered by a notification (a webhook) from the payment provider, and in production that notification is either not registered or is still pointed at the staging address. That fits the silence in the production logs: your system is never being told the payment happened.
DRIFT: Third-party | High | Payments succeed and orders save, yet production logs show nothing for the email step, which suggests the trigger never reaches your system. It has failed for everyone since the first production deploy, the classic pattern for a webhook set up in the vendor's test mode but not in live mode.
DRIFT: Configuration | Medium | If the webhook is registered correctly, the next suspect is a production setting such as a missing signing secret or email-sending key, which would stop the step before it logs anything useful.
DRIFT: Infrastructure | Low | A firewall or domain rule could block the incoming notification, but that usually leaves some trace of rejected requests.
CHECK: Compare webhook settings in the payment dashboard | Open the payment provider's dashboard, switch between test mode and live mode, and find the webhooks or notifications page in each. Note the destination address and which events are ticked. | If live mode has no webhook, or it points at a staging address, you have found it. If both look identical, move to the next check.
CHECK: Look at delivery attempts for one real order | In live mode, open a recent successful payment and look for a delivery log or events tab on the webhook. | Failed attempts with an error code mean the notification is sent but rejected, so the problem is on your side (configuration or infrastructure). No attempts at all confirms it was never registered.
CHECK: Send yourself a test event | Most payment dashboards have a send test event button on the webhook page. Send one to the production address while someone watches the production logs. | If the logs stay silent, the notification is not reaching you. If they show it arriving and then failing, the problem is a production setting.
CHECK: Ask who owns email sending settings | Ask whoever set up production which email-sending account and key it uses, and whether that key was added to production at launch. | A missing or test-only email key points to configuration rather than the vendor.
RULED_OUT: Version | You confirmed both environments run the same build.
RULED_OUT: Data | Orders save correctly and the failure affects every customer, which does not match a data-shape problem.
RULED_OUT: Caching | Caching affects what people see on screen, not whether a background email is triggered.
HANDOVER: Order confirmation emails have never sent in production, though they work on staging and orders save correctly.
HANDOVER: Production logs show no activity at all for the email step, not even a failure.
HANDOVER: Same build in both environments. Payments succeed in the provider dashboard.
HANDOVER: I suspect the live-mode webhook is missing or pointed at staging. I have checked: [add your findings from the dashboard here].
HANDOVER: Could you confirm the live webhook address and that the production signing secret and email key are set?
FLIP: If the live-mode webhook exists, points at production and shows successful deliveries, the verdict moves to Configuration: something inside your production setup is dropping the event.`,
  },
  {
    id: 'dashboard',
    title: 'Blank dashboard for some accounts',
    blurb: 'Reports load fine in staging. In production, a slice of customers see an empty page.',
    tag: 'Data',
    input: {
      symptom:
        'The new analytics dashboard loads with charts for every staging account. In production, most customers see it fine, but a group of accounts get a completely blank page with no charts and no error message.',
      worksIn: 'Staging',
      failsIn: 'Production',
      failureKind: 'Blank or missing data',
      affected: 'Some users or accounts',
      started: 'After a data migration',
      checked: ['Same build version in both', 'Feature flags compared', 'Tried another account', 'Cleared cache or used incognito'],
      notes: 'The affected accounts seem to be older customers. Support says every complaint so far is from an account created before 2023. Staging uses a fresh set of test accounts created last month.',
    },
    result: `VERDICT: Data
CONFIDENCE: High
SUMMARY: Older production accounts probably hold data that the new dashboard does not expect, for example empty fields or old formats left over from before the migration. Staging cannot show this because every staging account is new and was created with clean, complete data.
DRIFT: Data | High | Only accounts created before 2023 are affected, the problem began after a data migration, and staging only has fresh test accounts. That combination points at old records whose shape differs from new ones.
DRIFT: Permissions | Low | Older accounts could sit on a legacy plan or role that lacks access to the new reports, although that would more often show an access message than a blank page.
DRIFT: Configuration | Low | You compared feature flags and found no difference, so a per-account setting is only worth checking if the data checks come back clean.
CHECK: Line up two production accounts side by side | Pick one affected pre-2023 account and one working account created recently. In the admin panel, compare their profile fields, plan, region, currency and any settings the dashboard might use. | Empty or unusual values on the old account only (for example no region or an old currency code) confirm a data problem and tell the engineer exactly which field to look at.
CHECK: Find the youngest affected account | Ask support for the creation dates of every account that complained, and find the most recent one. | A clean cut-off date usually matches a past product change or migration, which narrows down which field is involved.
CHECK: Look for a partial load | On an affected account, open the dashboard and change the date range to only the last week. | If charts appear for recent dates, older data is the problem rather than the account itself.
CHECK: Ask whether the migration covered every account | Ask whoever ran the migration whether it ran for all accounts or only active ones, and whether any accounts were skipped or failed. | A list of skipped accounts that matches the complaints settles it.
RULED_OUT: Version | Both environments run the same build, and most production accounts work.
RULED_OUT: Caching | Clearing the cache and using an incognito window made no difference.
RULED_OUT: Configuration | Feature flags match between environments.
HANDOVER: The new dashboard shows a blank page, with no error, for some production accounts. It works for all staging accounts.
HANDOVER: Every affected account so far was created before 2023. Staging only has test accounts created last month.
HANDOVER: This started after the data migration. Same build in both environments, flags match, not a cache issue.
HANDOVER: Comparing an affected and a working account, these fields differ: [add what you found].
HANDOVER: Could you check whether the dashboard handles empty or legacy values in those fields, and whether the migration covered these accounts?
FLIP: If a newly created production account also shows a blank page, account age is a coincidence and the verdict moves towards Configuration or Infrastructure.`,
  },
  {
    id: 'feature',
    title: 'New feature missing after release',
    blurb: 'The release is live, but production users still see the old screen.',
    tag: 'Cache',
    input: {
      symptom:
        'We released a redesigned settings page yesterday. It shows on staging for everyone. In production, most people still see the old settings page, though one or two colleagues say they can see the new one.',
      worksIn: 'Staging',
      failsIn: 'Production',
      failureKind: 'Feature missing or not showing',
      affected: 'Some users or accounts',
      started: 'After a recent deploy',
      checked: ['Feature flags compared'],
      notes: 'The flag for the new settings page is switched on in both staging and production. The release notes say the deploy finished successfully.',
    },
    result: `VERDICT: Caching
CONFIDENCE: Medium
SUMMARY: The release has probably reached production, but many browsers or a content delivery network are still serving the previous copy of the page. The fact that a few colleagues see the new version while most people do not fits a cache that is being refreshed unevenly.
DRIFT: Caching | Medium | The flag is on, the deploy reported success, and a small number of people see the new page. Mixed results for identical accounts usually mean some people are getting a stored older copy.
DRIFT: Version | Medium | If production runs on several servers and the deploy only reached some of them, people would see old or new pages depending on which server they hit. This looks almost identical from the outside, so the first check separates the two.
DRIFT: Configuration | Low | The flag matches, but it may be targeted, for example only switched on for internal staff, which would explain why only colleagues see it.
CHECK: Open production in an incognito window | Open a private or incognito window, log in to production with an account that currently sees the old page, and go to settings. | If the new page appears, it is caching. If the old page still appears, move to the next check.
CHECK: Check the flag's targeting rules | Open the feature flag in the flag tool and look past the on/off switch at who it targets: everyone, a percentage, or named groups. Compare with staging. | A percentage rollout or a staff-only rule in production explains the pattern and makes this Configuration.
CHECK: Compare the version number shown in the app | If the app shows a version or build number (often in the footer, the about page or the help menu), ask two people, one who sees the new page and one who does not, to read it out. | Different numbers mean the deploy did not reach every server, which makes this a Version problem.
CHECK: Ask how long pages are cached | Ask whoever manages hosting how long production pages and scripts are cached and whether the cache was cleared after the release. | A long cache with no clear-out after release confirms the verdict and gives the fix.
RULED_OUT: Data | The problem is about which version of the page is shown, not what data appears on it.
RULED_OUT: Permissions | People with the same role see different versions, so access rules are unlikely to be the cause.
HANDOVER: The redesigned settings page is live on staging but most production users still see the old page since yesterday's release.
HANDOVER: A few colleagues do see the new page. The feature flag is on in both environments and the deploy reported success.
HANDOVER: Incognito test result: [add result]. Flag targeting: [add result]. Version numbers seen: [add result].
HANDOVER: Could you check whether the cache was cleared after the release and whether every production server is on the new build?
FLIP: If an incognito window still shows the old page and two people report different version numbers, the verdict moves to Version: the deploy did not fully land.`,
  },
];
