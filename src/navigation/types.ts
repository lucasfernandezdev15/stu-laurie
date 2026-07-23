export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ContentDetail: { episodeId: string };
  Player: { episodeId: string };
  Subscribe: undefined;
};
