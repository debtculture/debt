/* =============================================================================
   COMMUNITY DATA - Hall of Fame Member Information
   ============================================================================= */

/**
 * Hall of Fame Members Database
 * 
 * Each member object contains:
 * @property {string} name - Display name of the member (MUST match leaderboard CSV username exactly)
 * @property {string} walletAddress - Solana wallet address (or 'WALLET_ADDRESS_HERE' if not provided)
 * @property {string} holderSince - Date when member became a holder (MM/DD/YYYY or 'TBD')
 * @property {string} xLink - Link to member's X (Twitter) profile
 * @property {string} img - Cloudinary URL for profile picture
 * @property {boolean} coreContributor - Manually assigned special recognition badge (default: false)
 * 
 * NOTE: Badges are now automatically calculated based on leaderboard performance!
 * - Monthly Winner Badges: Auto-detected from 1st/2nd/3rd place finishes
 * - Milestone Badges: Auto-assigned based on total points (50, 100, 250, 500, 1000)
 * - Profile Pioneer: Auto-detected if walletAddress is set
 * - Consistent Contributor: Auto-detected if 10+ events participated
 * - Core Contributor: Manually set via coreContributor flag
 */

const members = [
    {
        name: 'Autopsy',
        walletAddress: '5aRXLjG3G4dxUu3oVXKQyk9u9b8qfSjLKFwLEbQyWcto',
        holderSince: '07/21/2024',
        xLink: 'https://x.com/AutopsyT2',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758110923/rKUcuWaF_400x400_d3fqvc.jpg',
        coreContributor: false
    },
    {
        name: 'Catavina',
        walletAddress: '67AmN618UrkHE3QAL1FPr2HAW1ubaeeLFf2bf4xhxtia',
        holderSince: '11/17/2024',
        xLink: 'https://x.com/catavina17',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723030/catavina_dfcvoe.jpg',
        coreContributor: false
    },
    {
        name: 'Lou',
        walletAddress: '46aaAd2EmhUegQJhn4eouCVnyEp1V3N7bWbZCYkutXZK',
        holderSince: '01/10/2025',
        xLink: 'https://x.com/louisedbegin',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1752948926/Lou2_kxasor.jpg',
        coreContributor: false
    },
    {
        name: 'Tormund',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '11/17/2024',
        xLink: 'https://x.com/Tormund_17',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Tormund_pj4hwd.jpg',
        coreContributor: false
    },
    {
        name: 'JPEG',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '07/22/2024',
        xLink: 'https://x.com/jpegfein',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755034794/JPEG_rte1vj.jpg',
        coreContributor: false
    },
    {
        name: 'Blu',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '02/14/2025',
        xLink: 'https://x.com/blu_chek',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1760549072/blu_dewnfk.jpg',
        coreContributor: false
    },
    {
        name: 'Drinks',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '05/18/2025',
        xLink: 'https://x.com/drinkonsaturday',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1748906211/Drinks_tibhzd.jpg',
        coreContributor: false
    },
    {
        name: 'Renee',
        walletAddress: '9QUqzJjrjefaHxcW1cYWTixwf27fkJokLsztmW97TuAa',
        holderSince: '02/11/2025',
        xLink: 'https://x.com/ReneeBush96829',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747850503/Renee_eekhuh.jpg',
        coreContributor: false
    },
    {
        name: 'Ambient',
        walletAddress: '38LctvVHGX3mvZhwGmQC6McJHujDY2HJfUAEf3TYu6yW',
        holderSince: '05/23/2025',
        xLink: 'https://x.com/AmbientSound',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1748906930/Ambient_jztyfi.jpg',
        coreContributor: false
    },
    {
        name: 'Tom',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '02/04/2025',
        xLink: 'https://x.com/deadend_king',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111318/tom_firsei.jpg',
        coreContributor: false
    },
    {
        name: 'Lunicking',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '11/17/2024',
        xLink: 'https://x.com/Lunicking178677',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Lunic_k1ndzn.jpg',
        coreContributor: false
    },
    {
        name: 'Cory',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '05/30/2025',
        xLink: 'https://x.com/CoryBOnChain',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747354104/Cory_qntp8y.jpg',
        coreContributor: false
    },
    {
        name: 'Dan',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '05/30/2025',
        xLink: 'https://x.com/DanVibes10',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747354104/Dan_uu4sey.jpg',
        coreContributor: false
    },
    {
        name: 'DK',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/PgHYinzer86',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111442/dk_aqpdct.jpg',
        coreContributor: false
    },
    {
        name: 'Cody',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/CodyMarmaduke',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758747646/Cody_ab60wn.jpg',
        coreContributor: false
    },
    {
        name: 'Rankin',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '06/27/2025',
        xLink: 'https://x.com/rankin56696',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111531/rankin_mnn26k.jpg',
        coreContributor: false
    },
    {
        name: 'Scrappy',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '08/29/2025',
        xLink: 'https://x.com/bigsoup6_7',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1748906211/Scrappy_gqtw4x.jpg',
        coreContributor: false
    },
    {
        name: 'Shay',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '11/17/2024',
        xLink: 'https://x.com/ShayTheSlayerS2',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Shay_ajnxzj.jpg',
        coreContributor: false
    },
    {
        name: 'Tonic',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '11/17/2024',
        xLink: 'https://x.com/TonicFrost',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Tonic_c6ixwy.jpg',
        coreContributor: false
    },
    {
        name: 'Carla',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '11/17/2024',
        xLink: 'https://x.com/carla_strack',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723030/Carla_dpewoe.jpg',
        coreContributor: false
    },
    {
        name: 'Boss',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/Boss_On_Chain',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111105/boss_f7cqjf.jpg',
        coreContributor: false
    },
    {
        name: 'Josh',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '11/17/2024',
        xLink: 'https://x.com/JoshSnibbs',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723030/Josh_wogszg.jpg',
        coreContributor: false
    },
    {
        name: 'YG',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '11/17/2024',
        xLink: 'https://x.com/Yunggyp',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/YG_kmuucu.jpg',
        coreContributor: false
    },
    {
        name: 'Mike',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/2Noisy4You',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111641/mike_axd2vu.jpg',
        coreContributor: false
    },
    {
        name: 'Dylan',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '11/17/2024',
        xLink: 'https://x.com/DylanEberhard',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723030/Dylan_nxjguk.jpg',
        coreContributor: false
    },
    {
        name: 'ANTI',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/gniKugneP',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594381/anti_b9s7yv.jpg',
        coreContributor: false
    },
    {
        name: 'Momma Blu',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '02/14/2025',
        xLink: 'https://x.com/AngelaPatt86456',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1760549073/mblu_gjlpwh.jpg',
        coreContributor: false
    },
    {
        name: 'Thurston',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/ThurstonWaffles',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032869/Thurston_n6zd2i.jpg',
        coreContributor: false
    },
    {
        name: 'Michael',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/p_r_o_m_o__',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111977/promo_jea2uu.jpg',
        coreContributor: false
    },
    {
        name: 'Gnomie',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '08/29/2025',
        xLink: 'https://x.com/medraresteaker',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758112105/gnomie_epet05.jpg',
        coreContributor: false
    },
    {
        name: 'AJ',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/blaze_mb21',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032499/AJ_s3hfjk.png',
        coreContributor: false
    },
    {
        name: 'George Eager',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '03/16/2025',
        xLink: 'https://x.com/edition1',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032568/George_Eager_ckxq9y.jpg',
        coreContributor: false
    },
    {
        name: 'Denzel',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/0xDnxl',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032699/Denzel_bmt4td.jpg',
        coreContributor: false
    },
    {
        name: 'Tree',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/TheresaWeik',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032771/Tree_bggo4f.jpg',
        coreContributor: false
    },
    {
        name: 'Money Miller',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/ItsMoneyMiller',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761593775/Money_Miller_trk6pb.jpg',
        coreContributor: false
    },
    {
        name: 'Begonia',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/BegoniaOnChain',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761595015/begonia_gl1fhe.jpg',
        coreContributor: false
    },
    {
        name: 'DaveR',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/DaveRmetax',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594982/daver_xdqju7.jpg',
        coreContributor: false
    },
    {
        name: 'Gabriel',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/MakersPassing',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594935/gabriel_pqrnv9.jpg',
        coreContributor: false
    },
    {
        name: 'Jersey',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/JerseytoAsia',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594870/Jersey_uuewsv.jpg',
        coreContributor: false
    },
    {
        name: 'DEV',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/diamondba11z',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1762185965/dev_oubtdl.jpg',
        coreContributor: false
    },
    {
        name: 'Morgen',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/AiArsenals',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594764/morgen_eupy13.jpg',
        coreContributor: false
    },
    {
        name: 'Newyn',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/Newyn69420',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594714/newyn_uxvn6r.jpg',
        coreContributor: false
    },
    {
        name: 'NiNa',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/niinaa_art',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594644/nina_lzk9ff.jpg',
        coreContributor: false
    },
    {
        name: 'Anza',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/AnzaCreate',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594592/anza_ijj2om.jpg',
        coreContributor: false
    },
    {
        name: 'XELA',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/Xelarocket',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594536/Xela_glqx5e.jpg',
        coreContributor: false
    },
    {
        name: 'Numbaz',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/numbazhq',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594466/numbaz_cibybi.jpg',
        coreContributor: false
    }
];
