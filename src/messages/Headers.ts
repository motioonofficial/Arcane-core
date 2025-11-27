/**
 * Packet Header IDs
 * Incoming = Client -> Server
 * Outgoing = Server -> Client
 *
 * Based on Arcturus/Nitro protocol
 */

export const Incoming = {
    // Handshake
    ReleaseVersionEvent: 4000,
    InitDiffieHandshake: 3110,
    CompleteDiffieHandshake: 773,
    UniqueIdEvent: 2490,
    SSOTicketEvent: 2419,
    ClientVariablesEvent: 1053,
    InfoRetrieveEvent: 357,

    // Ping
    PongEvent: 2596,
    LatencyPingRequestEvent: 295,

    // Navigator
    RequestNewNavigatorDataEvent: 2110,
    RequestNewNavigatorRoomsEvent: 249,
    RequestNavigatorSettingsEvent: 1782,
    NewNavigatorActionEvent: 1703,
    NavigatorCategoryListModeEvent: 1202,
    NavigatorCollapseCategoryEvent: 1834,
    NavigatorUncollapseCategoryEvent: 637,
    SaveWindowSettingsEvent: 3159,
    GetUserFlatCatsEvent: 3027,
    GetPublicRoomsEvent: 2057,

    // Room
    GetGuestRoomEvent: 2230,
    OpenFlatConnectionEvent: 2312, // RequestRoomLoadEvent
    GoToFlatEvent: 685,
    GetRoomSettingsEvent: 3129,
    GetHeightMapEvent: 2300, // RequestRoomHeightmapEvent
    GetRoomEntryDataEvent: 2300,

    // Users
    GetCreditsInfoEvent: 273,
    GetHabboClubDataEvent: 869,
    ScrGetUserInfoEvent: 3166,
    GetUserInfoEvent: 357,
    GetAchievementsEvent: 219,
    GetBadgesEvent: 2769,
    GetInventoryEvent: 3150,
    GetBotInventoryEvent: 3848,
    GetPetInventoryEvent: 3095,
    GetWardrobeEvent: 2742,

    // Catalog
    GetCatalogIndexEvent: 1195,
    GetCatalogPageEvent: 412,
    PurchaseFromCatalogEvent: 3492,
    GetProductOfferEvent: 2594,
    GetClubGiftInfoEvent: 487,

    // Messenger
    GetBuddyRequestsEvent: 2448,
    GetFriendsEvent: 1523,
    MessengerInitEvent: 2781,
    FindNewFriendsEvent: 516,
    SendMsgEvent: 3567,
    RequestBuddyEvent: 3157,
    AcceptBuddyEvent: 137,
    DeclineBuddyEvent: 2890,
    RemoveBuddyEvent: 1689,
    FollowFriendEvent: 3997,

    // Chat
    ChatEvent: 1314,
    ShoutEvent: 2085,
    WhisperEvent: 1543,
    StartTypingEvent: 1597,
    CancelTypingEvent: 1474,

    // Room Users
    RoomUserWalkEvent: 3320,
    RoomUserLookAtEvent: 3301,
    RoomUserActionEvent: 2456,
    RoomUserDanceEvent: 2080,
    RoomUserSignEvent: 1975,

    // Room Items
    MoveObjectEvent: 248,
    MoveWallItemEvent: 168,
    PickupObjectEvent: 3456,
    PlaceObjectEvent: 1258,
    UseFurnitureEvent: 99,
    UseWallItemEvent: 210,

    // Trading
    OpenTradingEvent: 1481,
    AddItemToTradeEvent: 3107,
    RemoveItemFromTradeEvent: 3845,
    AcceptTradingEvent: 3863,
    UnacceptTradingEvent: 1444,
    ConfirmAcceptTradingEvent: 2760,
    CloseTradingEvent: 2341,

    // Moderation
    GetModeratorRoomInfoEvent: 707,
    GetUserInfoForModerationEvent: 3295,
    ModerateRoomEvent: 3260,
    ModToolRequestRoomChatlogEvent: 2587,
    ModToolRequestUserChatlogEvent: 1391,
    ModeratorActionEvent: 3842,

    // Games
    JoinQueueEvent: 1458,
    LeaveQueueEvent: 2384,
    Game2GetWeeklyLeaderboardEvent: 2565,

    // Wired
    UpdateTriggerEvent: 1520,
    UpdateActionEvent: 2281,
    UpdateConditionEvent: 3203,
    ApplySnapshotEvent: 3373,

    // Floor Plan Editor
    FloorPlanEditorRequestDoorSettingsEvent: 3559,
    FloorPlanEditorRequestBlockedTilesEvent: 1687,
    FloorPlanEditorSaveEvent: 875,

    // Misc
    GetSoundSettingsEvent: 2388,
    SetSoundSettingsEvent: 1367,
    EventLogEvent: 3457,

    // Additional packets
    GetPromoArticlesEvent: 3878,
    GetIgnoredUsersEvent: 813,
    GetRelationshipsEvent: 796,
    GetForumsListEvent: 2487,
    GetMOTDEvent: 21,
    GetAvailabilityStatusEvent: 3898,

    // Profile
    RequestUserProfileEvent: 3265,
    RequestWearingBadgesEvent: 2091,
    RequestProfileFriendsEvent: 2138,
} as const;

export const Outgoing = {
    // Handshake
    InitDiffieHandshakeComposer: 1347,
    CompleteDiffieHandshakeComposer: 3885,
    UniqueIdComposer: 2997,
    AuthenticationOkComposer: 2491,
    UserRightsComposer: 2116,
    AvailabilityStatusComposer: 2033,
    PingComposer: 3928,
    UserObjectComposer: 2725,
    UserPerksComposer: 2586,
    BuildersClubMembershipComposer: 1452,
    CfhTopicsInitComposer: 325,
    FavouriteChangedComposer: 2524,
    NoobnessLevelComposer: 3738,
    ChangeEmailResultComposer: 1815,
    UserBannedComposer: 1683,

    // Error
    GenericErrorComposer: 1600,

    // Navigator
    NavigatorSettingsComposer: 518,
    NavigatorMetaDataComposer: 3052,
    NavigatorLiftedRoomsComposer: 3104,
    NavigatorCollapsedCategoriesComposer: 1543,
    NavigatorSavedSearchesComposer: 3984,
    NavigatorEventCategoriesComposer: 3244,
    NewNavigatorSearchResultsComposer: 2690,
    GetGuestRoomResultComposer: 687,
    FlatControllersComposer: 634,
    RoomSettingsDataComposer: 1498,
    CanCreateRoomComposer: 378,
    RoomCategoriesComposer: 1562,

    // Room
    RoomOpenComposer: 758,
    RoomReadyComposer: 2031,
    FloorHeightMapComposer: 1301,
    HeightMapComposer: 2753,
    HeightMapUpdateComposer: 558,
    RoomEntryInfoComposer: 749,
    RoomVisualizationSettingsComposer: 3547,
    RoomPaintComposer: 2454,
    RoomFloorItemsComposer: 1778,
    RoomWallItemsComposer: 1369,
    RoomUsersComposer: 374,
    RoomInfoUpdatedComposer: 3671,
    RoomThicknessComposer: 3547,
    RoomRightsComposer: 780,
    RoomRightsListComposer: 1284,
    RoomOwnerComposer: 339,
    RoomScoreComposer: 482,
    CloseConnectionComposer: 3651,
    RoomUserStatusComposer: 1640,
    RoomUserRemoveComposer: 2661,
    RoomDataComposer: 687,
    RoomPaneComposer: 749,
    RoomUserDataComposer: 3920,
    DanceComposer: 2233,
    CarryObjectComposer: 1474,
    AvatarEffectComposer: 1167,
    RoomUnitIdleComposer: 1797,

    // User
    UserUpdateComposer: 1640,
    UserStatusComposer: 1640,
    UserDataComposer: 3672,
    CreditBalanceComposer: 3475,
    ActivityPointsComposer: 2018,
    HabboClubSubscriptionComposer: 954,
    ScrSendUserInfoComposer: 954,
    UserClubComposer: 954,
    AchievementsComposer: 305,
    BadgesComposer: 717,
    InventoryComposer: 994,
    WardrobeComposer: 3315,

    // Catalog
    CatalogIndexComposer: 1032,
    CatalogPageComposer: 804,
    CatalogOfferComposer: 3388,
    PurchaseOkComposer: 869,
    PurchaseErrorComposer: 1404,
    NotEnoughBalanceComposer: 3914,
    CatalogUpdatedComposer: 1866,
    ClubGiftInfoComposer: 619,

    // Messenger
    MessengerInitComposer: 1605,
    BuddyListComposer: 3130,
    BuddyRequestsComposer: 280,
    NewBuddyRequestComposer: 2219,
    FriendListUpdateComposer: 2800,
    NewConsoleMessageComposer: 1587,
    RoomInviteComposer: 3870,
    FindFriendsProcessResultComposer: 1210,
    FollowFriendFailedComposer: 3048,

    // Chat
    ChatComposer: 1446,
    ShoutComposer: 1036,
    WhisperComposer: 2704,
    UserTypingComposer: 1717,

    // Inventory
    UnseenItemsComposer: 2103,
    FurniListInvalidateComposer: 3151,
    BotInventoryComposer: 3086,
    PetInventoryComposer: 2455,

    // Items
    ObjectAddComposer: 1534,
    ObjectUpdateComposer: 3776,
    ObjectRemoveComposer: 2703,
    ItemAddComposer: 2187,
    ItemUpdateComposer: 2009,
    ItemRemoveComposer: 3208,
    SlideObjectComposer: 2569,
    ItemStateComposer: 2376, // State-only update (non-limited items)
    OneWayDoorStatusComposer: 2376,
    FloorItemOnRollerComposer: 2569,

    // Trading
    TradingOpenComposer: 2505,
    TradingStartComposer: 2505,
    TradingItemListComposer: 2024,
    TradingAcceptComposer: 2568,
    TradingConfirmationComposer: 2720,
    TradingCompleteComposer: 1001,
    TradingCloseComposer: 1373,
    TradingNotOpenComposer: 2020,
    TradingOtherNotAllowedComposer: 2154,
    TradingYouAreNotAllowedComposer: 3058,

    // Moderation
    ModeratorRoomInfoComposer: 1333,
    ModeratorUserInfoComposer: 2866,
    ModeratorRoomChatlogComposer: 3434,
    ModeratorUserChatlogComposer: 3377,
    BroadcastMessageAlertComposer: 3801,

    // Alerts
    NotificationDialogComposer: 1992,
    HabboBroadcastComposer: 3801,
    MOTDNotificationComposer: 2035,

    // Floor Plan Editor
    FloorPlanEditorDoorSettingsComposer: 1664,
    FloorPlanEditorBlockedTilesComposer: 3990,
    RoomFloorThicknessUpdatedComposer: 3547,

    // Misc
    SoundSettingsComposer: 1367,
    LatencyResponseComposer: 10,

    // Additional composers
    PromoArticlesComposer: 1893,
    IgnoredUsersComposer: 126,
    RelationshipsComposer: 2016,
    ForumsListComposer: 3001,

    // Profile
    UserProfileComposer: 3898,
    UserWearingBadgesComposer: 717,
    ProfileFriendsComposer: 2016,
} as const;

export type IncomingHeader = typeof Incoming[keyof typeof Incoming];
export type OutgoingHeader = typeof Outgoing[keyof typeof Outgoing];
