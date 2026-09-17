export default function SettingsPage() {
  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">Clinic Settings</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>
            Settings and configuration options are currently managed via code configuration or Supabase dashboard. Admin UI will be added in a future update.
          </p>
        </div>
      </div>
    </div>
  )
}
