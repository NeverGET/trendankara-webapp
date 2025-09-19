/**
 * Poll results export utilities
 * Generate CSV with poll results data
 */

import { getVoterDetails, getVoteStatistics, getVoteResults } from '@/lib/db/poll-votes';
import { getPollById } from '@/lib/db/polls';

interface ExportOptions {
  includeVoterDetails?: boolean;
  includeStatistics?: boolean;
  dateFormat?: 'iso' | 'locale';
}

/**
 * Format date for export
 */
function formatDate(date: Date | string, format: 'iso' | 'locale' = 'locale'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'iso') {
    return d.toISOString();
  }

  return d.toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Escape CSV field value
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) return '';

  const str = String(field);
  // If field contains comma, quotes, or newline, wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) return '';

  // Get headers from first object if not provided
  if (!headers) {
    headers = Object.keys(data[0]);
  }

  // Create header row
  const headerRow = headers.map(escapeCSVField).join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return headers!.map(header => escapeCSVField(row[header])).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Export poll results to CSV
 */
export async function exportPollResultsToCSV(
  pollId: number,
  options: ExportOptions = {}
): Promise<{ filename: string; content: string; mimeType: string }> {
  const {
    includeVoterDetails = false,
    includeStatistics = true,
    dateFormat = 'locale'
  } = options;

  // Get poll data
  const poll = await getPollById(pollId);
  if (!poll) {
    throw new Error('Poll not found');
  }

  // Get vote results
  const results = await getVoteResults(pollId);

  let csvContent = '';

  // Add poll information
  csvContent += 'Anket Bilgileri\n';
  csvContent += `Başlık,${escapeCSVField(poll.title)}\n`;
  csvContent += `Açıklama,${escapeCSVField(poll.description || '')}\n`;
  csvContent += `Tür,${escapeCSVField(poll.poll_type)}\n`;
  csvContent += `Başlangıç,${formatDate(poll.start_date, dateFormat)}\n`;
  csvContent += `Bitiş,${formatDate(poll.end_date, dateFormat)}\n`;
  csvContent += `Durum,${poll.is_active ? 'Aktif' : 'Pasif'}\n`;
  csvContent += '\n';

  // Add results
  csvContent += 'Sonuçlar\n';
  const resultsData = results.map(item => ({
    'Seçenek': item.title,
    'Oy Sayısı': item.votes,
    'Yüzde': `${item.percentage}%`
  }));
  csvContent += arrayToCSV(resultsData);
  csvContent += '\n';

  // Add statistics if requested
  if (includeStatistics) {
    const stats = await getVoteStatistics(pollId);

    csvContent += '\nİstatistikler\n';
    csvContent += `Toplam Oy,${stats.totalVotes}\n`;
    csvContent += `Benzersiz Cihaz,${stats.uniqueDevices}\n`;
    csvContent += `Benzersiz IP,${stats.uniqueIps}\n`;
    csvContent += '\n';

    if (stats.votesPerDay.length > 0) {
      csvContent += 'Günlük Oylar\n';
      const dailyData = stats.votesPerDay.map(day => ({
        'Tarih': formatDate(day.date, dateFormat),
        'Oy Sayısı': day.votes
      }));
      csvContent += arrayToCSV(dailyData);
      csvContent += '\n';
    }
  }

  // Add voter details if requested (with privacy consideration)
  if (includeVoterDetails) {
    const voters = await getVoterDetails(pollId, 1000);

    if (voters.length > 0) {
      csvContent += '\nOy Detayları (Son 1000)\n';
      const voterData = voters.map(voter => ({
        'Seçilen': voter.voted_for,
        'Cihaz ID': voter.device_id.substring(0, 8) + '...', // Partial for privacy
        'IP Adresi': voter.ip_address ? voter.ip_address.replace(/\.\d+$/, '.xxx') : '', // Partial for privacy
        'Tarih': formatDate(voter.created_at, dateFormat)
      }));
      csvContent += arrayToCSV(voterData);
    }
  }

  // Generate filename
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `anket-${poll.id}-${timestamp}.csv`;

  return {
    filename,
    content: csvContent,
    mimeType: 'text/csv;charset=utf-8'
  };
}

/**
 * Export multiple polls to CSV
 */
export async function exportMultiplePollsToCSV(
  pollIds: number[]
): Promise<{ filename: string; content: string; mimeType: string }> {
  const allData: any[] = [];

  for (const pollId of pollIds) {
    const poll = await getPollById(pollId);
    if (!poll) continue;

    const results = await getVoteResults(pollId);
    const stats = await getVoteStatistics(pollId);

    allData.push({
      'Anket ID': poll.id,
      'Başlık': poll.title,
      'Tür': poll.poll_type,
      'Başlangıç': formatDate(poll.start_date, 'locale'),
      'Bitiş': formatDate(poll.end_date, 'locale'),
      'Durum': poll.is_active ? 'Aktif' : 'Pasif',
      'Toplam Oy': stats.totalVotes,
      'Benzersiz Cihaz': stats.uniqueDevices,
      'Seçenek Sayısı': results.length,
      'En Çok Oy Alan': results[0]?.title || '-'
    });
  }

  const csvContent = arrayToCSV(allData);

  // Generate filename
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `anketler-ozet-${timestamp}.csv`;

  return {
    filename,
    content: csvContent,
    mimeType: 'text/csv;charset=utf-8'
  };
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(filename: string, content: string): void {
  // Add BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export poll results and trigger download
 */
export async function exportAndDownloadPollResults(
  pollId: number,
  options?: ExportOptions
): Promise<void> {
  try {
    const { filename, content } = await exportPollResultsToCSV(pollId, options);
    downloadCSV(filename, content);
  } catch (error) {
    console.error('Error exporting poll results:', error);
    throw error;
  }
}

/**
 * Export multiple polls and trigger download
 */
export async function exportAndDownloadMultiplePolls(
  pollIds: number[]
): Promise<void> {
  try {
    const { filename, content } = await exportMultiplePollsToCSV(pollIds);
    downloadCSV(filename, content);
  } catch (error) {
    console.error('Error exporting polls:', error);
    throw error;
  }
}