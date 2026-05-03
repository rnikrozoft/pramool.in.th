/** Shape of GET /users used by session preload and UserContext. */
export type SessionUser = {
    userId: string
    firstName: string
    lastName: string
    credit: number
    withdrawalBlocked?: boolean
    withdrawalBlockReason?: string
}
