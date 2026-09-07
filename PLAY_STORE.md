# Google Play listing

**Name.** AI Hype Tycoon  
**Short.** Build an AI startup from a garage. Raise, ship, go public — keep going.  
**Full.**

Build an AI company in a garage and ride the hype cycle — for as long as the tape lets you.

Hire researchers, cluster engineers, growth interns, and alignment leads. Train models. Demo them. Launch a product people actually pay for. Raise from friends-and-family through Series C, ring the bell, then keep operating as a public company. Survive GPU shortages, intern AGI tweets, newspaper calls, and winter multiples.

Play it clean — or steal papers, fake benchmarks, and farm a waitlist of bots. Go public. Or go broke. Or get acquired. The IPO is not the end.

Single player. Offline. No ads. Progress saves on your phone.

**What's new (2.1).** Living headquarters instead of a text dump. Slower days. Products and revenue. Unlimited timeline after listing. Auto-bumped release APK on every commit.

**Category.** Simulation / Casual  
**Content rating.** PEGI 12 / ESRB Teen — mild language in satirical events, no violence, no real-money gambling, no user-generated chat.  
**Privacy policy URL.** Host `PRIVACY.md` (GitHub raw or Pages) and paste that URL in Play Console.  
**Data safety.** No data collected / shared. App does not encrypt in transit because it does not transmit player data.

**Store graphic sizes (you still need to upload).**

- Icon 512×512
- Feature graphic 1024×500
- Phone screenshots ≥ 16:9 or 9:16, at least two

**Application ID.** `com.aihypetycoon.app`  
**Version.** Auto-bumped. Source of truth: `android/version.properties` (`versionName` + `versionCode`). Every push to `main` increments the patch and `versionCode`, then publishes a GitHub Release with a sideload APK and a Play AAB.  
**Release.** AAB from the Release APK workflow (or Signed Play AAB if you have an upload key), plus a Play Console app created as a game / simulation.
