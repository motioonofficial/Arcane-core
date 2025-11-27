/**
 * FriendRequest - Represents a pending friend request
 */

export class FriendRequest {
    private id: number;
    private username: string;
    private look: string;

    constructor(data: { id: number; username: string; look: string }) {
        this.id = data.id;
        this.username = data.username;
        this.look = data.look;
    }

    public getId(): number {
        return this.id;
    }

    public getUsername(): string {
        return this.username;
    }

    public getLook(): string {
        return this.look;
    }
}
