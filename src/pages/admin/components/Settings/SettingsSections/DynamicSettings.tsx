import React from 'react';
import { Palette, RefreshCw, Upload } from 'lucide-react';
import { FieldWrapper, formatKey, isColorField, isValidHexColor } from '../SettingsComponents';

interface DynamicSettingsProps {
  groupedSettings: Record<string, any[]>;
  isModified: (key: string) => boolean;
  handleChange: (key: string, value: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, key: string) => void;
  uploading: string | null;
  inputCls: (key: string) => string;
}

export const DynamicSettings: React.FC<DynamicSettingsProps> = ({
  groupedSettings,
  isModified,
  handleChange,
  handleFileUpload,
  uploading,
  inputCls
}) => {
  return (
    <div className="space-y-6">
      {Object.entries(groupedSettings).map(([category, items]) => {
        const isDesignCategory = category.toLowerCase() === 'design';
        const colorItems = items.filter(item => isColorField(item.setting_key));
        const nonColorItems = items.filter(item => !isColorField(item.setting_key));

        return (
          <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900 capitalize flex items-center gap-2">
                {isDesignCategory && <Palette className="h-4 w-4 text-slate-500" />} {category}
              </h3>
            </div>

            <div className="p-5">
              {isDesignCategory && colorItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-slate-500" /> Color Settings
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                    {colorItems.map((setting) => (
                      <div key={setting.setting_key} className="flex flex-col gap-2">
                        <FieldWrapper settingKey={setting.setting_key} label={formatKey(setting.setting_key)} isModified={isModified(setting.setting_key)} isSaved={Boolean(setting.id && setting.id !== '')}>
                          <div className="flex gap-3 items-center">
                            <input type="color" value={isValidHexColor(setting.setting_value) ? setting.setting_value : '#000000'} onChange={(e) => handleChange(setting.setting_key, e.target.value)} className="w-14 h-14 rounded-lg border-2 border-gray-200 cursor-pointer" />
                            <div className="flex-1 flex flex-col gap-1">
                              <input type="text" value={setting.setting_value} onChange={(e) => handleChange(setting.setting_key, e.target.value)} placeholder="#000000" className={`${inputCls(setting.setting_key)} font-mono ${!isValidHexColor(setting.setting_value) && setting.setting_value ? 'border-red-300 bg-red-50' : ''}`} />
                            </div>
                            {setting.setting_value && isValidHexColor(setting.setting_value) && (
                              <div className="w-12 h-12 rounded-lg border-2 border-gray-200 flex-shrink-0" style={{ backgroundColor: setting.setting_value }} />
                            )}
                          </div>
                        </FieldWrapper>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {(isDesignCategory ? nonColorItems : items).map((setting) => (
                  <div key={setting.setting_key} className="flex flex-col gap-2">
                    <FieldWrapper settingKey={setting.setting_key} label={formatKey(setting.setting_key)} isModified={isModified(setting.setting_key)} isSaved={Boolean(setting.id && setting.id !== '')}>
                      <div className="w-full">
                        {setting.setting_key === 'logo_url' ? (
                          <div className="flex flex-col gap-3">
                            {setting.setting_value && <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200"><img src={setting.setting_value} alt="Logo" className="h-20 w-auto max-w-full object-contain" /></div>}
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setting.setting_key)} className="hidden" id={`file-input-${setting.setting_key}`} />
                            <button onClick={() => (document.getElementById(`file-input-${setting.setting_key}`) as HTMLInputElement)?.click()} disabled={uploading === setting.setting_key} className="w-full px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-slate-400 hover:bg-gray-50 flex items-center justify-center gap-2 text-sm min-h-[44px] transition-colors">
                              {uploading === setting.setting_key ? <><RefreshCw className="h-4 w-4 hidden" /><span>Uploading...</span></> : <><Upload className="h-4 w-4" /><span>Upload Logo</span></>}
                            </button>
                          </div>
                        ) : setting.setting_type === 'boolean' ? (
                          <select value={setting.setting_value} onChange={(e) => handleChange(setting.setting_key, e.target.value)} className={inputCls(setting.setting_key)}><option value="true">True</option><option value="false">False</option></select>
                        ) : setting.setting_type === 'number' ? (
                          <input type="number" value={setting.setting_value} onChange={(e) => handleChange(setting.setting_key, e.target.value)} className={inputCls(setting.setting_key)} />
                        ) : (
                          <input type="text" value={setting.setting_value} onChange={(e) => handleChange(setting.setting_key, e.target.value)} className={inputCls(setting.setting_key)} />
                        )}
                      </div>
                    </FieldWrapper>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

