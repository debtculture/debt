/* =============================================================================
   TOOLS PAGE LOGIC
   ============================================================================= */

// =================================================================================
// --- INITIALIZATION ---
// =================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize wallet manager
    if (typeof initializeWalletManager !== 'undefined') {
        await initializeWalletManager();
    }
    
    // Generate initial tweet
    generateTweet();
});

// =================================================================================
// --- TWEET GENERATOR ---
// =================================================================================

const TWEETS = [
    "Don't fade $DEBT. Doxxed Dev, LP Burned, 16+ months old. A real community at a $100k mcap. The floor is concrete, the narrative is undefeated. You're still early.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Tired of rugs? @DebtCulture's $DEBT is the answer.\n✅ Doxxed Founder\n✅ LP Burned\n✅ 16+ Months Strong\nA safe floor at $100k mcap is a gift.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The system is a lie. @DebtCulture is the truth. $DEBT isn't just a memecoin; it's a movement. \"Don't Ever Believe Them.\" An easy bet on #Solana.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Looking for a real community that's been building for over a year? Check out @DebtCulture. $DEBT is the play. Doxxed dev, burned LP, $100k mcap. As safe as it gets.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The alpha is simple: $DEBT.\n16 months old. Doxxed leader. Burned LP. $100k mc.\n@DebtCulture is the real deal.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Why are people still sleeping on @DebtCulture? $DEBT has been here for 16 months, has a doxxed dev, and burned LP. The risk/reward at $100k mcap is insane.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Don't get fooled by fakes. The original $DEBT rebellion is @DebtCulture. 16+ months of building, doxxed founder, and a community that never quit. This is the one.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "This might be the last time you see @DebtCulture's $DEBT under $200k market cap. A 16-month-old project with this foundation won't stay this low forever.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The @DebtCulture community is one of the strongest on #Solana. Fully doxxed dev, locked treasury, and a 16-month track record. $DEBT is programmed to win.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Alpha: $DEBT\nWhy: Doxxed dev, burned LP, 16mo history, cult community, $100k mc.\nThe real rebellion is at @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Stop gambling on 1-hour old coins. Invest in a real community with @DebtCulture and $DEBT. 16+ months strong, doxxed dev, burned LP, only $100k mcap. This is the ground floor.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "$DEBT by @DebtCulture has survived every market condition for 16 months. That's not luck, that's a foundation. Doxxed, safe, undervalued at $100k.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The narrative is unmatched: \"Don't Ever Believe Them.\" $DEBT isn't just a token, it's a rebellion against the debt-based system. Join @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "When $DEBT hit $340k mcap with ZERO marketing, I knew this was special. Now at $100k with a stronger foundation? Easy decision.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "66M+ tokens burned. 150M locked in treasury. Doxxed founder. 16 months of building. $DEBT by @DebtCulture is the safest play on Solana right now.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You want a 100x? Start with a project that won't rug. $DEBT checks every box: doxxed, burned LP, renounced, 16mo track record. Still only $100k mcap.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The War Room on Telegram is where real $DEBT holders coordinate. No paper hands, just conviction. Join @DebtCulture and see what we're building.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Don't Ever Believe Them. The central banks lied. The politicians lied. $DEBT is the truth. 16 months of rebellion on #Solana.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "If you're looking for the next 50-100x, you need three things: safety, narrative, and low mcap. $DEBT has all three. @DebtCulture is the play.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The founder of @DebtCulture is doxxed and has been building for 16+ months. That's not a dev, that's a leader. $DEBT is different.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Renounced contract. 0% tax. LP burned forever. Treasury locked until 2026. This is what real tokenomics looks like. $DEBT by @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Every day $DEBT survives is proof of concept. 16 months in crypto is a lifetime. The community is diamond-handed. @DebtCulture is inevitable.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The copycats keep trying to steal the $DEBT name, but there's only one original: @DebtCulture. 16 months of receipts. Don't get fooled.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "At $100k mcap, $DEBT is criminally undervalued. The website alone is worth more than that. This won't last. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Bull market survivors are rare. $DEBT has been through it all for 16 months. Doxxed, safe, undervalued. The smart money is accumulating.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You don't need another rug. You need $DEBT. Fully doxxed founder, burned LP, locked treasury, 16+ month track record. @DebtCulture is the way.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The rebellion against the debt system isn't just a narrative, it's a movement. $DEBT by @DebtCulture has been building this for over a year.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "$DEBT hit $340k with zero marketing. Imagine what happens when the world finds out. Still only $100k mcap. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Looking for a low-risk, high-reward play? $DEBT checks all the safety boxes and sits at $100k. This is the definition of asymmetric upside.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The floor is concrete. The narrative is undefeated. The community is diamond-handed. $DEBT by @DebtCulture is the safest bet in crypto.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "16 months of building. 66M+ tokens burned. 150M locked. Doxxed founder. $DEBT isn't a gamble, it's a calculated play. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Don't Ever Believe Them. The system wants you in debt forever. $DEBT is the exit. Join the rebellion at @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The $DEBT community isn't just holders, it's believers. We've been here for 16+ months and we're not leaving. @DebtCulture is family.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Every metric screams buy: doxxed dev, burned LP, 16mo history, $100k mcap, locked treasury. $DEBT by @DebtCulture is a no-brainer.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You're either early to $DEBT or you're ngmi. The foundation is rock solid. The upside is massive. Don't fade @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The original $DEBT launched July 2024. 16+ months later, still here, still building. That's not a meme, that's a movement. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Doxxed founder? Check. Burned LP? Check. Renounced contract? Check. 16 months proven? Check. $DEBT is the safest play on Solana.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The War Room doesn't sleep. The community is building 24/7. $DEBT by @DebtCulture is more than a token, it's a lifestyle.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "When the next bull run starts, projects with real foundations will moon first. $DEBT has 16 months of proof. @DebtCulture is ready.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "At $100k mcap, you're getting $DEBT at a massive discount. The ATH was $340k with zero marketing. Do the math.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The central banks print money. We burn $DEBT. 66M+ tokens already gone forever. That's deflationary by design. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Don't believe the FUD. The original $DEBT is at @DebtCulture. 16 months of receipts. Everything else is a copycat.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You want generational wealth? Start with projects that won't rug. $DEBT: doxxed, burned, renounced, proven. @DebtCulture is the way.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The narrative writes itself: \"Don't Ever Believe Them.\" $DEBT is the rebellion against the debt-based system. Join @DebtCulture now.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "150M tokens locked in treasury until July 2026. That's commitment. That's vision. That's $DEBT by @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The floor is $100k. The ceiling is generational wealth. $DEBT has 16 months of proof. @DebtCulture is the play.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Tired of being early to rugs? Be early to something real. $DEBT by @DebtCulture has been building for 16+ months. This is your chance.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The system enslaves you with debt. $DEBT sets you free. It's not just a token, it's a rebellion. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Doxxed founder building for 16+ months. That's not a developer, that's a visionary. $DEBT is different. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You don't fade a project that's been here for 16 months. You don't fade a doxxed dev. You don't fade $DEBT. @DebtCulture is inevitable.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The $DEBT community doesn't chase pumps. We build empires. 16 months of diamond hands. @DebtCulture is the real deal.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Every project says they're safe. $DEBT proves it: doxxed, burned LP, renounced, 16mo track record, locked treasury. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "At $100k mcap, this is a gift. $DEBT has everything: safety, narrative, community, time-tested foundation. @DebtCulture won't stay this low.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The rebellion started July 2024. 16+ months later, we're still here. $DEBT by @DebtCulture is unbreakable.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Don't Ever Believe Them. The debt system is a scam. $DEBT is the truth. Join the rebellion at @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You're not early to Bitcoin. You're not early to ETH. But you ARE early to $DEBT. 16 months old, $100k mcap, doxxed dev. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The smart money accumulates when no one's watching. $DEBT is still under the radar at $100k mcap. Don't miss this. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "66M+ burned. 150M locked. 16 months proven. Doxxed founder. $DEBT isn't a risk, it's a certainty. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "When $DEBT hits $1M mcap, you'll wish you bought at $100k. When it hits $10M, you'll know you should have. Don't wait. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The original $DEBT rebellion. 16 months of building. Zero compromises. @DebtCulture is the only one that matters.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Looking for the safest high-upside play on Solana? $DEBT checks every box. Doxxed, burned, proven, undervalued. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The floor is concrete. The narrative is undefeated. The founder is doxxed. The LP is burned. $DEBT is inevitable. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You want a project that survives bear markets? $DEBT has been here for 16+ months. Diamond-handed community. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Don't fade the rebellion. Don't fade 16 months of building. Don't fade a doxxed dev. Don't fade $DEBT. @DebtCulture is the future.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The central banks want you enslaved in debt forever. $DEBT is the key to freedom. Join @DebtCulture and break the chains.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Every metric says buy: $100k mcap, doxxed dev, burned LP, 16mo track record, locked treasury. $DEBT by @DebtCulture is a no-brainer.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "When the next bull run starts, you'll want to be holding projects with real foundations. $DEBT has 16 months of proof. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The War Room is where legends are made. Join the $DEBT community on Telegram and see what we're building. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Don't Ever Believe Them. The politicians lied. The banks lied. $DEBT is the truth. 16 months of rebellion. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "At $100k mcap, $DEBT is criminally undervalued. The website, the community, the narrative—all worth 10x more. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You want a 100x? Find a project that won't rug. $DEBT: doxxed, burned, renounced, 16mo proven. That's your 100x. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The floor is $100k. The ceiling is infinity. $DEBT has the foundation to go all the way. @DebtCulture is inevitable.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "16 months of building. 66M+ burned. 150M locked. Doxxed founder. $DEBT isn't a meme, it's a mission. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The rebellion against the debt system started 16 months ago. $DEBT by @DebtCulture is still early. Join now before it's too late.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You don't need another rug. You need $DEBT. Fully doxxed, fully safe, fully undervalued. @DebtCulture is the way forward.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Don't get fooled by copycats. The original $DEBT is at @DebtCulture. 16+ months of receipts. Everything else is noise.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The narrative is unmatched: Don't Ever Believe Them. $DEBT is the rebellion. The community is diamond-handed. @DebtCulture is the future.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "When $DEBT moons, remember: you had 16 months to buy at $100k. Don't say we didn't warn you. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The system wants you broke. $DEBT wants you free. Join the rebellion at @DebtCulture and break the chains.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Every project promises the moon. $DEBT delivers: doxxed, burned, renounced, 16mo proven, locked treasury. @DebtCulture is different.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You're either accumulating $DEBT at $100k or you're ngmi. The foundation is rock solid. The upside is massive. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The War Room doesn't quit. The community doesn't fold. $DEBT doesn't die. 16 months of proof. @DebtCulture is inevitable.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Don't Ever Believe Them. The debt-based system is collapsing. $DEBT is the escape hatch. Join @DebtCulture now.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "At $100k mcap, you're getting $DEBT at a generational discount. The ATH was $340k. The next ATH? 10x higher. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The original $DEBT. The only $DEBT. 16+ months of building at @DebtCulture. Don't settle for cheap imitations.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You want asymmetric upside? $DEBT at $100k mcap with a doxxed dev, burned LP, and 16mo track record. That's the definition. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The floor is concrete. The community is diamond-handed. The founder is doxxed. $DEBT by @DebtCulture is the safest play on Solana.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Don't fade 16 months of building. Don't fade a doxxed dev. Don't fade a burned LP. Don't fade $DEBT. @DebtCulture is the future.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The central banks print unlimited money. We burn $DEBT forever. 66M+ already gone. That's real scarcity. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "When everyone's chasing new launches, the smart money is accumulating proven projects. $DEBT has 16 months of proof. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The rebellion isn't coming. It's already here. $DEBT by @DebtCulture has been building for 16+ months. Join us.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You want a project that survives? $DEBT survived 16 months of market chaos with a doxxed dev and burned LP. That's survival of the fittest.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "150M tokens locked until 2026. That's not just tokenomics, that's commitment to the vision. $DEBT by @DebtCulture is built different.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The narrative is powerful: Don't Ever Believe Them. The execution is flawless: 16 months, doxxed, burned, proven. $DEBT is inevitable.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "At $100k mcap, every dollar you invest has 100x potential with minimal downside. That's the $DEBT value proposition. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "The War Room is active 24/7. The community never sleeps. $DEBT is more than a token, it's a movement. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "Don't Ever Believe Them. The system is rigged. $DEBT is the answer. 16 months of rebellion on Solana. @DebtCulture.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump",
    
    "You're not buying a token. You're buying into 16 months of proven resilience, a doxxed visionary, and a diamond-handed community. $DEBT.\n\nCA: 9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump"
];

let currentTweet = '';

/**
 * Generates a random tweet from the TWEETS array
 */
function generateTweet() {
    const randomIndex = Math.floor(Math.random() * TWEETS.length);
    currentTweet = TWEETS[randomIndex];
    document.getElementById('tweet-display').textContent = currentTweet;
}

/**
 * Copies current tweet to clipboard
 */
function copyTweet() {
    if (!currentTweet) {
        alert('Generate a tweet first!');
        return;
    }
    
    navigator.clipboard.writeText(currentTweet)
        .then(() => {
            const copyBtn = document.querySelector('.tool-btn.secondary');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.background = 'rgba(85, 255, 85, 0.2)';
            copyBtn.style.borderColor = '#55ff55';
            copyBtn.style.color = '#55ff55';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
                copyBtn.style.borderColor = '';
                copyBtn.style.color = '';
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy tweet:', err);
            alert('Failed to copy. Please select and copy manually.');
        });
}

// =================================================================================
// --- MARKET CAP CALCULATOR ---
// =================================================================================

// Tradable supply constant (total supply minus locked/burned)
const TRADABLE_SUPPLY = 940000000;

/**
 * Calculates USD value based on token amount and market cap
 */
function calculateValue() {
    const tokenAmount = parseFloat(document.getElementById('token-amount').value);
    const marketCap = parseFloat(document.getElementById('market-cap').value);
    const resultDiv = document.getElementById('calc-result');
    
    // Validation
    if (!tokenAmount || tokenAmount <= 0) {
        resultDiv.textContent = 'Please enter a valid token amount';
        resultDiv.className = 'calc-result error';
        return;
    }
    
    if (!marketCap || marketCap <= 0) {
        resultDiv.textContent = 'Please enter a valid market cap';
        resultDiv.className = 'calc-result error';
        return;
    }
    
    // Calculate: (token_amount / tradable_supply) * market_cap
    const usdValue = (tokenAmount / TRADABLE_SUPPLY) * marketCap;
    
    // Format result
    const formatted = usdValue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    resultDiv.textContent = formatted;
    resultDiv.className = 'calc-result success';
}

// =================================================================================
// --- WALLET VALIDATOR ---
// =================================================================================

/**
 * Validates if a Solana wallet address is valid
 */
function validateWallet() {
    const address = document.getElementById('wallet-address').value.trim();
    const resultDiv = document.getElementById('wallet-result');
    
    if (!address) {
        resultDiv.textContent = 'Please enter a wallet address';
        resultDiv.className = 'calc-result error';
        return;
    }
    
    try {
        // Use Solana web3.js to validate address
        const publicKey = new solanaWeb3.PublicKey(address);
        
        // Check if it's a valid base58 address (32 bytes)
        if (publicKey.toBase58() === address) {
            resultDiv.textContent = '✅ Valid Solana Address';
            resultDiv.className = 'calc-result success';
        } else {
            resultDiv.textContent = '❌ Invalid Address Format';
            resultDiv.className = 'calc-result error';
        }
    } catch (error) {
        resultDiv.textContent = '❌ Invalid Solana Address';
        resultDiv.className = 'calc-result error';
    }
}

// =================================================================================
// --- MOBILE NAVIGATION ---
// =================================================================================

/**
 * Toggles mobile hamburger menu
 */
window.toggleMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    
    if (!menu || !hamburger) return;
    
    const isOpen = menu.style.display === 'block';
    
    menu.style.display = isOpen ? 'none' : 'block';
    hamburger.classList.toggle('active', !isOpen);
    hamburger.setAttribute('aria-expanded', !isOpen);
};

/**
 * Closes mobile hamburger menu
 */
window.closeMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    
    if (!menu || !hamburger) return;
    
    menu.style.display = 'none';
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
};
