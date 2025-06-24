export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Calendar: undefined;
  Anniversaries: undefined;
  Settings: undefined;
};

export type AnniversaryStackParamList = {
  AnniversaryHome: undefined;
  AnniversaryCreate: undefined;
};

export type CalendarStackParamList = {
  CalendarHome: undefined;
  EventCreate: undefined;
  EventEdit: { eventId: string };
};