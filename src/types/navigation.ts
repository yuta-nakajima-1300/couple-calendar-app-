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
  EventDetail: { eventId: string };
  EventEdit: { eventId: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  ProfileEdit: undefined;
  PartnerSettings: undefined;
  ReminderSettings: undefined;
  CalendarSettings: undefined;
  NotificationSettings: undefined;
  SecurityDiagnostics: undefined;
  Help: undefined;
  Contact: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};