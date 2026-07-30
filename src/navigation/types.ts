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
  ContentDetail: { episodeId: string; kind?: 'video' | 'live' };
  Player: { episodeId: string; kind?: 'video' | 'live' };
  Subscribe: undefined;
};
