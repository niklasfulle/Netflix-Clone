jest.mock('@/lib/db', () => ({
  db: {
    profilImg: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logBackendAction: jest.fn(),
}));

import { getProfileImgs } from '../profile-imgs';
import { db } from '@/lib/db';

describe('profile images action - Input & Fehlerbehandlung', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('✅ sollte erfolgreich leeres Array zurückgeben', async () => {
    (db.profilImg.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getProfileImgs();

    expect(result).toEqual({ profilImgs: [] });
  });

  it('✅ sollte erfolgreich Profilbilder zurückgeben', async () => {
    const mockImages = [
      { id: '1', url: 'default.jpg' },
      { id: '2', url: 'avatar.jpg' },
    ];
    (db.profilImg.findMany as jest.Mock).mockResolvedValue(mockImages);

    const result = await getProfileImgs();

    expect(result).toEqual({ profilImgs: mockImages });
  });

  it('❌ sollte Fehler werfen wenn DB fehlschlägt', async () => {
    (db.profilImg.findMany as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    await expect(getProfileImgs()).rejects.toThrow('Database connection failed');
  });

  it('❌ sollte Fehler werfen wenn Datenbankzugriff nicht erlaubt ist', async () => {
    (db.profilImg.findMany as jest.Mock).mockRejectedValue(
      new Error('Access denied')
    );

    await expect(getProfileImgs()).rejects.toThrow('Access denied');
  });
});
