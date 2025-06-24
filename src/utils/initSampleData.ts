import { SimpleDataService } from '../services/dataService.simple';

export const initializeSampleData = async () => {
  const demoUserId = 'demo-user-1';
  const demoCoupleId = 'demo-couple-1';
  
  try {
    // 既存のデータをチェック
    const existingEvents = await SimpleDataService.getUserEvents(demoUserId);
    const existingAnniversaries = await SimpleDataService.getCoupleAnniversaries(demoCoupleId);
    
    // サンプル予定を追加
    if (existingEvents.length === 0) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      await SimpleDataService.createEvent(
        demoUserId,
        '映画デート',
        tomorrow.toISOString().split('T')[0],
        '19:00',
        '新作映画を見に行く',
        'date'
      );
      
      await SimpleDataService.createEvent(
        demoUserId,
        'ランチミーティング',
        today.toISOString().split('T')[0],
        '12:00',
        'プロジェクトの打ち合わせ',
        'work'
      );
      
      await SimpleDataService.createEvent(
        demoUserId,
        '散歩',
        nextWeek.toISOString().split('T')[0],
        '10:00',
        '公園で散歩',
        'personal'
      );
      
      console.log('Sample events created');
    }
    
    // サンプル記念日を追加
    if (existingAnniversaries.length === 0) {
      const anniversary1 = new Date('2023-06-01');
      const anniversary2 = new Date('2023-12-24');
      
      await SimpleDataService.createAnniversary(
        demoCoupleId,
        '付き合った記念日',
        anniversary1.toISOString().split('T')[0]
      );
      
      await SimpleDataService.createAnniversary(
        demoCoupleId,
        '初デート記念日',
        anniversary2.toISOString().split('T')[0]
      );
      
      console.log('Sample anniversaries created');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize sample data:', error);
    return false;
  }
};