/* =============================================================================
   TOKEN GATING CONFIGURATION
   Centralized constants for wallet-based access control
   ============================================================================= */

const GATING_CONFIG = {
    // Minimum token requirements (in full token units, not raw)
    PROFILE_CREATE_MIN: 100000,
    FORUM_COMMENT_MIN: 100000,
    FORUM_POST_MIN: 250000,
    GAME_SCORE_SUBMIT_MIN: 100000,
    VERIFIED_HOLDER_MIN: 250000,
    
    // Token contract address
    TOKEN_MINT: '9NQc7BnhfLbNwVFXrVsymEdqEFRuv5e1k7CuQW82pump'
};
