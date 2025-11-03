/* =============================================================================
   COMMUNITY DATA - Hall of Fame Member Information
   ============================================================================= */

/**
 * Hall of Fame Members Database
 * 
 * Each member object contains:
 * @property {string} name - Display name of the member
 * @property {string} walletAddress - Solana wallet address (or 'WALLET_ADDRESS_HERE' if not provided)
 * @property {string} holderSince - Date when member became a holder (MM/DD/YYYY or 'TBD')
 * @property {string} xLink - Link to member's X (Twitter) profile
 * @property {string} img - Cloudinary URL for profile picture
 * @property {Array<Object>} badges - Array of badge objects with 'type' and 'tier' properties
 * 
 * Badge Types:
 * - 'spaces': Attendance/hosting X Spaces
 * - 'burn': Token burning contributions
 * - 'holding': Token holding milestones
 * - 'shiller': Recruitment efforts
 * - 'meme': Meme creation
 * - 'year1': Year 1 holder status
 * 
 * Badge Tiers:
 * - 'bronze': Entry level
 * - 'silver': Mid-level
 * - 'gold': High-level
 * - 'amethyst': Top-level
 * - 'single': Special one-off badges
 */

const members = [
    {
        name: 'Autopsy',
        walletAddress: '5aRXLjG3G4dxUu3oVXKQyk9u9b8qfSjLKFwLEbQyWcto',
        holderSince: '07/21/2024',
        xLink: 'https://x.com/AutopsyT2',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758110923/rKUcuWaF_400x400_d3fqvc.jpg',
        badges: [
            { type: 'spaces', tier: 'amethyst' },
            { type: 'burn', tier: 'gold' },
            { type: 'holding', tier: 'gold' },
            { type: 'shiller', tier: 'single' },
            { type: 'meme', tier: 'single' }
        ]
    },
    {
        name: 'Catavina',
        walletAddress: '67AmN618UrkHE3QAL1FPr2HAW1ubaeeLFf2bf4xhxtia',
        holderSince: '11/17/2024',
        xLink: 'https://x.com/catavina17',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723030/catavina_dfcvoe.jpg',
        badges: [
            { type: 'spaces', tier: 'amethyst' },
            { type: 'holding', tier: 'gold' },
            { type: 'shiller', tier: 'single' },
            { type: 'meme', tier: 'single' }
        ]
    },
    {
        name: 'Lou',
        walletAddress: '46aaAd2EmhUegQJhn4eouCVnyEp1V3N7bWbZCYkutXZK',
        holderSince: '01/10/2025',
        xLink: 'https://x.com/louisedbegin',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1752948926/Lou2_kxasor.jpg',
        badges: [
            { type: 'spaces', tier: 'amethyst' },
            { type: 'holding', tier: 'silver' },
            { type: 'shiller', tier: 'single' }
        ]
    },
    {
        name: 'Tormund',
        walletAddress: '6zSvKM6vWwgrfjoek7JMgiguBjriUxiVMWN35tnp7h4M',
        holderSince: '11/17/2024',
        xLink: 'https://x.com/Tormund_17',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Tormund_pj4hwd.jpg',
        badges: [
            { type: 'holding', tier: 'gold' },
            { type: 'spaces', tier: 'silver' },
            { type: 'shiller', tier: 'single' },
            { type: 'meme', tier: 'single' }
        ]
    },
    {
        name: 'JPEG',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '07/22/2024',
        xLink: 'https://x.com/jpegfein',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755034794/JPEG_rte1vj.jpg',
        badges: [
            { type: 'spaces', tier: 'gold' },
            { type: 'holding', tier: 'gold' },
            { type: 'shiller', tier: 'single' },
            { type: 'meme', tier: 'single' }
        ]
    },
    {
        name: 'blu',
        walletAddress: '3cm8PDy7RGDYj4ShSdix4nzrqd7ty5gHzMiUwg5nWVWA',
        holderSince: '02/14/2025',
        xLink: 'https://x.com/blu_chek',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1760549072/blu_dewnfk.jpg',
        badges: [
            { type: 'holding', tier: 'silver' },
            { type: 'spaces', tier: 'silver' },
            { type: 'shiller', tier: 'single' }
        ]
    },
    {
        name: 'Drinks',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '05/18/2025',
        xLink: 'https://x.com/drinkonsaturday',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1748906211/Drinks_tibhzd.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Renee',
        walletAddress: '9QUqzJjrjefaHxcW1cYWTixwf27fkJokLsztmW97TuAa',
        holderSince: '02/11/2025',
        xLink: 'https://x.com/ReneeBush96829',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747850503/Renee_eekhuh.jpg',
        badges: [
            { type: 'holding', tier: 'silver' },
            { type: 'spaces', tier: 'bronze' },
            { type: 'shiller', tier: 'single' }
        ]
    },
    {
        name: 'Ambient',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '05/23/2025',
        xLink: 'https://x.com/AmbientSound',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1748906930/Ambient_jztyfi.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Tom',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '02/04/2025',
        xLink: 'https://x.com/deadend_king',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111318/tom_firsei.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'shiller', tier: 'single' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Lunicking',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '11/17/2024',
        xLink: 'https://x.com/Lunicking178677',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1746723031/Lunic_k1ndzn.jpg',
        badges: [
            { type: 'holding', tier: 'gold' },
            { type: 'spaces', tier: 'bronze' },
            { type: 'shiller', tier: 'single' },
            { type: 'meme', tier: 'single' }
        ]
    },
    {
        name: 'Cory B',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '05/30/2025',
        xLink: 'https://x.com/CoryBOnChain',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747354104/Cory_qntp8y.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Dan',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '05/30/2025',
        xLink: 'https://x.com/DanVibes10',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747354104/Dan_uu4sey.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'DK',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/PgHYinzer86',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111442/dk_aqpdct.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Cody',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/CodyMarmaduke',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758747646/Cody_ab60wn.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Rankin',
        walletAddress: '7PEo1vTv9aUAwBgVBKStYTE1NqVpJkb96MddEaN1akJ1',
        holderSince: '06/27/2025',
        xLink: 'https://x.com/rankin56696',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111531/rankin_mnn26k.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Scrappy',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '08/29/2025',
        xLink: 'https://x.com/bigsoup6_7',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1752948926/scrappy2_ihsso6.jpg',
        badges: [
            { type: 'holding', tier: 'silver' },
            { type: 'spaces', tier: 'silver' }
        ]
    },
    {
        name: 'Mia',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/GirlMia9079',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1754610304/KNg3MAIS_400x400_tmabka.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Elvis',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/ElpatronSFC',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1752608182/Elvis_yrnpxh.png',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Bstr',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/Bstr___',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1752608094/bstr_knv2eq.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'George',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '03/19/2025',
        xLink: 'https://x.com/GeorgeCdr28874',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747417142/George_q1e0c2.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Dog',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/Dog66515910',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1752948926/Dog2_sb9l5v.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' },
            { type: 'shiller', tier: 'single' }
        ]
    },
    {
        name: 'Bacon',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/NoItsMyServe',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594307/bacon_v5g4qp.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' },
            { type: 'shiller', tier: 'single' }
        ]
    },
    {
        name: 'ZOMBi',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/HauskenHelge',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1747354104/ZOMBi_obepxi.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Cyanide',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/ipoopcrypto',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111719/cy_sxrobe.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Demitrieus',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/RecklesUnicorn',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758748132/Demetrius_knntdo.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Ugo',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '08/27/2025',
        xLink: 'https://x.com/0x_Ugo',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758747924/Ugo_flbfsw.jpg',
        badges: [
            { type: 'holding', tier: 'gold' }
        ]
    },
    {
        name: 'ANTI',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/gniKugneP',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594381/anti_b9s7yv.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Momma Blu',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '02/14/2025',
        xLink: 'https://x.com/AngelaPatt86456',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1760549073/mblu_gjlpwh.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Thurston',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/ThurstonWaffles',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032869/Thurston_n6zd2i.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Michael',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/p_r_o_m_o__',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758111977/promo_jea2uu.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Gnomie',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '08/29/2025',
        xLink: 'https://x.com/medraresteaker',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1758112105/gnomie_epet05.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'AJ',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/blaze_mb21',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032499/AJ_s3hfjk.png',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'George Eager',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: '03/16/2025',
        xLink: 'https://x.com/edition1',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032568/George_Eager_ckxq9y.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Denzel',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/0xDnxl',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032699/Denzel_bmt4td.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Tree',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/TheresaWeik',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1755032771/Tree_bggo4f.jpg',
        badges: [
            { type: 'spaces', tier: 'silver' },
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Money Miller',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/ItsMoneyMiller',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761593775/Money_Miller_trk6pb.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Begonia',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/BegoniaOnChain',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761595015/begonia_gl1fhe.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'DaveR',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/DaveRmetax',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594982/daver_xdqju7.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Gabriel',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/MakersPassing',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594935/gabriel_pqrnv9.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Jersey',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/JerseytoAsia',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594870/Jersey_uuewsv.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'DEV',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/diamondba11z',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1762185965/dev_oubtdl.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Morgen',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/AiArsenals',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594764/morgen_eupy13.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Newyn',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/Newyn69420',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594714/newyn_uxvn6r.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'NiNa',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/niinaa_art',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594644/nina_lzk9ff.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Anza',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/AnzaCreate',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594592/anza_ijj2om.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'XELA',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/Xelarocket',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594536/Xela_glqx5e.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    },
    {
        name: 'Numbaz',
        walletAddress: 'WALLET_ADDRESS_HERE',
        holderSince: 'TBD',
        xLink: 'https://x.com/numbazhq',
        img: 'https://res.cloudinary.com/dpvptjn4t/image/upload/f_auto,q_auto/v1761594466/numbaz_cibybi.jpg',
        badges: [
            { type: 'holding', tier: 'bronze' }
        ]
    }
];
