/**
 * FurnitureDefinition - Defines furniture item types from items_base
 */

export enum ItemType {
    FLOOR = 's',
    WALL = 'i',
    EFFECT = 'e',
    BADGE = 'b',
    ROBOT = 'r',
    PET = 'p'
}

export enum InteractionType {
    DEFAULT = 'default',
    GATE = 'gate',
    TELEPORT = 'teleport',
    DICE = 'dice',
    BOTTLE = 'bottle',
    ROLLER = 'roller',
    ONE_WAY_GATE = 'onewaygate',
    BED = 'bed',
    VENDINGMACHINE = 'vendingmachine',
    TROPHY = 'trophy',
    STACKHELPER = 'stackhelper',
    MANNEQUIN = 'mannequin',
    HOPPER = 'hopper',
    COSTUME_HOPPER = 'costumehopper',
    SITDOWN = 'sitdown',
    WIRED_TRIGGER = 'wired_trigger',
    WIRED_EFFECT = 'wired_effect',
    WIRED_CONDITION = 'wired_condition',
    PRESSURE_PLATE = 'pressure_plate',
    FIREWORKS = 'fireworks',
    COLOR_WHEEL = 'color_wheel'
}

export interface FurnitureDefinitionData {
    id: number;
    spriteId: number;
    publicName: string;
    itemName: string;
    type: string;
    width: number;
    length: number;
    stackHeight: number;
    canStack: boolean;
    canSit: boolean;
    canLay: boolean;
    isWalkable: boolean;
    allowRecycle: boolean;
    allowTrade: boolean;
    allowMarketplace: boolean;
    allowGift: boolean;
    allowInventoryStack: boolean;
    interactionType: string;
    interactionModesCount: number;
    vendingIds: string;
    multiHeight: string;
    customParams: string;
    effectIdMale: number;
    effectIdFemale: number;
}

export class FurnitureDefinition {
    private data: FurnitureDefinitionData;
    private heightArray: number[] = [];

    constructor(data: FurnitureDefinitionData) {
        this.data = data;
        this.parseMultiHeight();
    }

    private parseMultiHeight(): void {
        if (this.data.multiHeight && this.data.multiHeight.length > 0) {
            this.heightArray = this.data.multiHeight
                .split(';')
                .filter(h => h.length > 0)
                .map(h => parseFloat(h));
        }
    }

    public getHeightForState(state: number): number {
        if (this.heightArray.length > 0 && state < this.heightArray.length) {
            return this.heightArray[state];
        }
        return this.data.stackHeight;
    }

    // Getters
    public getId(): number { return this.data.id; }
    public getSpriteId(): number { return this.data.spriteId; }
    public getPublicName(): string { return this.data.publicName; }
    public getItemName(): string { return this.data.itemName; }
    public getType(): string { return this.data.type; }
    public getWidth(): number { return this.data.width; }
    public getLength(): number { return this.data.length; }
    public getStackHeight(): number { return this.data.stackHeight; }
    public canStack(): boolean { return this.data.canStack; }
    public canSit(): boolean { return this.data.canSit; }
    public canLay(): boolean { return this.data.canLay; }
    public isWalkable(): boolean { return this.data.isWalkable; }
    public canRecycle(): boolean { return this.data.allowRecycle; }
    public canTrade(): boolean { return this.data.allowTrade; }
    public canMarketplace(): boolean { return this.data.allowMarketplace; }
    public canGift(): boolean { return this.data.allowGift; }
    public canInventoryStack(): boolean { return this.data.allowInventoryStack; }
    public getInteractionType(): string { return this.data.interactionType; }
    public getInteractionModesCount(): number { return this.data.interactionModesCount; }
    public getVendingIds(): string { return this.data.vendingIds; }
    public getMultiHeight(): string { return this.data.multiHeight; }
    public getCustomParams(): string { return this.data.customParams; }
    public getEffectIdMale(): number { return this.data.effectIdMale; }
    public getEffectIdFemale(): number { return this.data.effectIdFemale; }

    public isFloorItem(): boolean {
        return this.data.type === ItemType.FLOOR;
    }

    public isWallItem(): boolean {
        return this.data.type === ItemType.WALL;
    }

    /**
     * Get the sit height for this furniture
     * This is the height offset for sitting/laying avatars
     * Java: Item.getBaseItem().getHeight() for chairs
     */
    public getSitHeight(): number {
        // For sit/lay items, the height is the stack height
        return this.data.stackHeight;
    }
}
