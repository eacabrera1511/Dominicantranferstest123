import { Download, X } from 'lucide-react';

interface DownloadBackupsProps {
  onClose: () => void;
}

export default function DownloadBackups({ onClose }: DownloadBackupsProps) {
  const backups = [
    {
      name: 'TravelSmart Backup (ZIP)',
      filename: 'travelsmart-backup-20251215-183000.zip',
      size: 'Latest full project backup (ZIP format)',
      path: '/backups/travelsmart-backup-20251215-183000.zip',
      date: 'December 15, 2024'
    },
    {
      name: 'TravelSmart Backup (TAR.GZ)',
      filename: 'travelsmart-backup-20251215-183000.tar.gz',
      size: 'Latest full project backup (TAR.GZ format)',
      path: '/backups/travelsmart-backup-20251215-183000.tar.gz',
      date: 'December 15, 2024'
    },
    {
      name: 'EdwinBooking Backup (ZIP)',
      filename: 'edwinbooking-backup-20251214-130628.zip',
      size: 'Previous project backup (ZIP format)',
      path: '/backups/edwinbooking-backup-20251214-130628.zip',
      date: 'December 14, 2024'
    },
    {
      name: 'EdwinBooking Backup (TAR.GZ)',
      filename: 'edwinbooking-backup-20251214-130618.tar.gz',
      size: 'Previous project backup (TAR.GZ format)',
      path: '/backups/edwinbooking-backup-20251214-130618.tar.gz',
      date: 'December 14, 2024'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Download className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Download Backups
              </h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Click on any backup below to download it to your computer.
          </p>

          <div className="space-y-4">
            {backups.map((backup) => (
              <a
                key={backup.filename}
                href={backup.path}
                download={backup.filename}
                className="block p-6 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border-2 border-transparent hover:border-teal-500 dark:hover:border-teal-400 transition-all duration-200 hover:shadow-lg group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {backup.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {backup.size}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-1">
                      {backup.filename}
                    </p>
                    <p className="text-xs text-teal-600 dark:text-teal-400">
                      {backup.date}
                    </p>
                  </div>
                  <Download className="w-8 h-8 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                </div>
              </a>
            ))}
          </div>

          <div className="mt-8 p-4 bg-teal-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Note:</strong> Each date has two backup formats available (ZIP and TAR.GZ).
              Choose the format that works best for your system.
            </p>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-teal-600 dark:text-teal-400 hover:underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
