module.exports = {
  // Default prefix used until a guild sets its own with /prefix (stored in Firestore, overrides this).
  DEFAULT_PREFIX: '.',
  COLORS: {
    PRIMARY: 0x38bdf8, // sky blue - default UI
    SUCCESS: 0x22c55e, // green
    DANGER: 0xef4444, // red
    WARNING: 0xf59e0b, // yellow/orange
  },
  EMOJIS: {
    // Custom emojis from the Pixel Villa server's own emoji list (Server Settings → Emoji).
    // Safe to reuse as-is: this bot runs in the same guild that owns them, so they render
    // correctly for every member regardless of which bot's message uses them. Mapped to
    // the closest semantic match; a few (GIVEAWAYS, TICKET, ARROW_LEFT/RIGHT, CLOSE) keep
    // their unicode fallback since no good custom equivalent exists in the current set.
    SUCCESS: '<a:success:1532986625343099050>',
    ERROR: '<a:error:1532986765105696778>',
    WARNING: '<a:Warning:1532986372716236932>',
    INFO: '<a:LP_Message:1532991009066324049>',
    LOADING: '<a:loading:1532985888118931517>',
    SECURITY: '<:Shield_2:1532989398642327594>',
    AUTOMOD: '<a:Warning:1532986372716236932>',
    MODERATION: '<a:ban:1532989769766801511>',
    LOGS: '<:Stats:1532990723408793661>',
    CUSTOMROLE: '<:owner:1532337324762075146>',
    UTILITY: '<a:settings:1532990547394957393>',
    GIVEAWAYS: '🎉',
    AUTORESPONDER: '<a:LP_Message:1532991009066324049>',
    WELCOMER: '<a:sparkles:1532986077651140620>',
    TICKET: '🎫',
    SELFROLE: '<:add:1532337807765278801>',
    MEDIA: '<:Link:1532991169984991302>',
    AUTONICK: '<:name:1532337141214871622>',
    ADD: '<:add:1532337807765278801>',
    REMOVE: '<:remove:1532337229907759124>',
    HIDE: '<:hide:1532336151854190743>',
    UNHIDE: '<:unhide:1532336276164841482>',
    LOCK: '<:lock:1532337641494937651>',
    UNLOCK: '<:unlock:1532337553217294528>',
    BACK: '<a:back:1532987608542744847>',
    ARROW_LEFT: '◀️',
    ARROW_RIGHT: '▶️',
    HOME: '<:HOME:1532991400503673055>',
    CLOSE: '✖️',
  },
  LIMITS: {
    PURGE_MAX: 999,
    EMBED_FIELD_VALUE: 1024,
    PAGE_SIZE_HELP: 10,
    PAGE_SIZE_LIST: 15,
    MAX_WARN_REASON_LENGTH: 512,
  },
  DEFAULTS: {
    ANTINUKE: {
      enabled: false,
      thresholds: {
        channelDelete: 3,
        channelCreate: 5,
        roleDelete: 3,
        roleCreate: 5,
        ban: 3,
        kick: 5,
        webhookCreate: 3,
      },
      windowMs: 10000,
      cooldownMs: 60000,
      action: 'strip_roles', // strip_roles | kick | ban
    },
    AUTOMOD: {
      antispam: { enabled: false, maxMessages: 6, intervalMs: 5000, timeoutMs: 120000 },
      antilink: { enabled: false, whitelistDomains: [] },
      antizalgo: { enabled: false },
      anticaps: { enabled: false, maxPercent: 70, minLength: 10 },
    },
    NIGHTMODE: { enabled: false, auto: false, timezone: 'UTC', startHour: 23, endHour: 7 },
  },
};
