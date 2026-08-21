export type {
  MediaHealthFinding,
  MediaHealthQuery,
  MediaHealthRepository,
  MediaHealthScan,
} from '@/lib/administration/media-health';

import { mediaHealthRepository } from '@/data/media-health';
import { createMediaHealthReader } from '@/lib/administration/media-health';
import { checkFfprobeAvailability } from '@/lib/media-probe';

export const mediaHealthReader = createMediaHealthReader({
  repository: mediaHealthRepository,
  checkAvailability: checkFfprobeAvailability,
});
