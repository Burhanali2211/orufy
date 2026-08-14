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
          <div key={category} className="bg-white border border-[#e8eaed] rounded-[24px] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#e8eaed] bg-[#f8f9fa]">
              <h3 className="font-medium text-[#202124] capitalize flex items-center gap-2 text-[18px]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>
                {isDesignCategory && <Palette className="h-5 w-5 text-[#5f6368]" />} {category}
              </h3>
            </div>

            <div className="p-6">
              {isDesignCategory && colorItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[15px] font-medium text-[#5f6368] mb-5 flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Color Settings
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {colorItems.map((setting) => (
                      <div key={setting.setting_key} className="flex flex-col gap-2">
                        <FieldWrapper settingKey={setting.setting_key} label={formatKey(setting.setting_key)} isModified={isModified(setting.setting_key)} isSaved={Boolean(setting.id && setting.id !== '')}>
                          <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border border-[#e8eaed] shadow-sm relative group cursor-pointer">
                                <input type="color" value={isValidHexColor(setting.setting_value) ? setting.setting_value : '#000000'} onChange={(e) => handleChange(setting.setting_key, e.target.value)} className="absolute -top-2 -left-2 w-20 h-20 cursor-pointer" />
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                              <input type="text" value={setting.setting_value} onChange={(e) => handleChange(setting.setting_key, e.target.value)} placeholder="#000000" className={`${inputCls(setting.setting_key)} font-mono ${!isValidHexColor(setting.setting_value) && setting.setting_value ? 'border-[#fad2cf] bg-[#fce8e6]' : ''}`} />
                            </div>
                          </div>
                        </FieldWrapper>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(isDesignCategory ? nonColorItems : items).map((setting) => (
                  <div key={setting.setting_key} className="flex flex-col gap-2">
                    <FieldWrapper settingKey={setting.setting_key} label={formatKey(setting.setting_key)} isModified={isModified(setting.setting_key)} isSaved={Boolean(setting.id && setting.id !== '')}>
                      <div className="w-full">
                        {setting.setting_key === 'logo_url' ? (
                          <div className="flex flex-col gap-3">
                            {setting.setting_value && <div className="flex items-center justify-center p-4 bg-[#f8f9fa] rounded-[24px] border border-[#e8eaed] min-h-[100px]"><img src={setting.setting_value} alt="Logo" className="h-20 w-auto max-w-full object-contain rounded-lg" /></div>}
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setting.setting_key)} className="hidden" id={`file-input-${setting.setting_key}`} />
                            <button onClick={() => (document.getElementById(`file-input-${setting.setting_key}`) as HTMLInputElement)?.click()} disabled={uploading === setting.setting_key} className="w-full px-5 py-3 border-2 border-dashed border-[#dadce0] rounded-full text-[#5f6368] hover:border-[#1a73e8] hover:bg-[#f8f9fa] flex items-center justify-center gap-2 text-[14px] font-medium min-h-[48px] transition-colors disabled:opacity-50">
                              {uploading === setting.setting_key ? <><div className="w-4 h-4 border-2 border-[#5f6368] border-t-transparent rounded-full animate-spin" /><span>Uploading...</span></> : <><Upload className="h-5 w-5" /><span>Upload Logo</span></>}
                            </button>
                          </div>
                        ) : setting.setting_type === 'boolean' ? (
                          <select value={setting.setting_value} onChange={(e) => handleChange(setting.setting_key, e.target.value)} className={`${inputCls(setting.setting_key)} appearance-none pr-10`} style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}><option value="true">True</option><option value="false">False</option></select>
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
