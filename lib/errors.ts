/** An error whose message is safe to show to the user as-is. */
export class UserError extends Error {}

export class NotFoundError extends UserError {}
