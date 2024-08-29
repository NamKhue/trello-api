export const WHITELIST_DOMAINS = ["http://localhost:5173"];

export const BOARD_TYPES = {
  PUBLIC: "public",
  PRIVATE: "private",
};

export const CARD_CONSTANTS = {
  NOTIFY_UNIT: {
    MINUTE: "minute",
    HOUR: "hour",
    DAY: "day",
    WEEK: "week",
  },
};

export const ROLE_TYPES = {
  CREATOR: "creator",
  OWNER: "owner",
  MEMBER: "member",
};

export const INVITATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

export const NOTIFICATION_CONSTANTS = {
  VIA: {
    LINK: "LINK",
  },
  TYPE: {
    DELETE: "DELETE",
    REMOVE: "REMOVE",
    INVITE: "INVITE",
    ADD: "ADD",
    DEADLINE: "DEADLINE",
    RESPONSE_INVITATION: "RESPONSE_INVITATION",
    CHANGE_ROLE: "CHANGE_ROLE",
  },
  FROM: {
    BOARD: "BOARD",
    CARD: "CARD",
  },
  RESPONSE: {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
  },
};
