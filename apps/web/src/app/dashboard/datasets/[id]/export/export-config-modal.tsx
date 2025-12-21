'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  Settings,
  Palette,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Sparkles,
} from 'lucide-react';
import {
  ExportConfiguration,
  ExportFormat,
  ExportSection,
  getDefaultExportConfig,
  groupSectionsByCategory,
  CONFIDENTIALITY_LEVELS,
  ExportSectionConfig,
} from '@/lib/export-types';

interface ExportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (config: ExportConfiguration) => void;
  datasetName: string;
}

type Step = 'format' | 'sections' | 'branding' | 'settings' | 'preview';

const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  overview: {
    label: 'Overview',
    description: 'Executive summary and organizational structure',
  },
  analytics: {
    label: 'Analytics',
    description: 'Detailed metrics and insights',
  },
  planning: {
    label: 'Planning',
    description: 'Scenarios and recommendations',
  },
  details: {
    label: 'Details',
    description: 'Granular data and employee information',
  },
};

export function ExportConfigModal({
  isOpen,
  onClose,
  onExport,
  datasetName,
}: ExportConfigModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('format');
  const [config, setConfig] = useState<ExportConfiguration>(
    getDefaultExportConfig('pdf', datasetName)
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'format', label: 'Format', icon: <FileText className="h-4 w-4" /> },
    { id: 'sections', label: 'Sections', icon: <Settings className="h-4 w-4" /> },
    { id: 'branding', label: 'Branding', icon: <Palette className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const canGoNext = currentStepIndex < steps.length - 1;
  const canGoPrev = currentStepIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleExport = () => {
    onExport(config);
  };

  const toggleSection = (sectionId: ExportSection) => {
    setConfig({
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    });
  };

  const toggleAllSections = (enabled: boolean) => {
    setConfig({
      ...config,
      sections: config.sections.map((s) => ({ ...s, enabled })),
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setConfig({
          ...config,
          branding: {
            ...config.branding,
            logo: base64,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const groupedSections = groupSectionsByCategory(config.sections);
  const enabledCount = config.sections.filter((s) => s.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">
              Customize Export
            </h2>
            <p className="text-sm text-stone-500">
              Configure your analytics report export
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-stone-200 bg-stone-50 px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-2 ${
                    index <= currentStepIndex
                      ? 'text-orange-600'
                      : 'text-stone-400'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      index < currentStepIndex
                        ? 'bg-orange-600 text-white'
                        : index === currentStepIndex
                        ? 'border-2 border-orange-600 bg-white text-orange-600'
                        : 'border-2 border-stone-300 bg-white text-stone-400'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 mx-4 ${
                      index < currentStepIndex ? 'bg-orange-600' : 'bg-stone-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Format Selection */}
          {currentStep === 'format' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                  Select Export Format
                </h3>
                <p className="text-sm text-stone-600">
                  Choose how you want to export your analytics report
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* PDF Option */}
                <button
                  onClick={() => setConfig({ ...config, format: 'pdf' })}
                  className={`rounded-lg border-2 p-6 text-left transition-all hover:border-orange-300 hover:shadow-md ${
                    config.format === 'pdf'
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-blue-100 p-3">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-stone-900">
                          PDF Slide Deck
                        </h4>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mb-2">
                        Professional presentation format
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Perfect for sharing with investors, board members, or executives.
                        Includes visualizations and narrative insights.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Excel Option */}
                <button
                  onClick={() => setConfig({ ...config, format: 'excel' })}
                  className={`rounded-lg border-2 p-6 text-left transition-all hover:border-orange-300 hover:shadow-md ${
                    config.format === 'excel'
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-green-100 p-3">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-stone-900">
                          Excel Workbook
                        </h4>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          Data Analysis
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mb-2">
                        Raw data with formatted tables
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Multi-sheet workbook with all data tables. Great for further
                        analysis, custom charts, or integration with other tools.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Section Selection */}
          {currentStep === 'sections' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">
                    Select Sections to Include
                  </h3>
                  <p className="text-sm text-stone-600">
                    {enabledCount} of {config.sections.length} sections selected
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAllSections(true)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    onClick={() => toggleAllSections(false)}
                    className="text-xs text-stone-600 hover:text-stone-700 font-medium"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedSections).map(([category, sections]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-stone-900">
                        {CATEGORY_LABELS[category]?.label || category}
                      </h4>
                      <span className="text-xs text-stone-500">
                        ({sections.filter((s) => s.enabled).length}/{sections.length})
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 -mt-1">
                      {CATEGORY_LABELS[category]?.description}
                    </p>

                    <div className="space-y-2">
                      {sections.map((section) => (
                        <label
                          key={section.id}
                          className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all hover:border-orange-300 ${
                            section.enabled
                              ? 'border-orange-200 bg-orange-50'
                              : 'border-stone-200 bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={section.enabled}
                            onChange={() => toggleSection(section.id)}
                            className="mt-1 h-4 w-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-stone-900">
                                {section.label}
                              </span>
                              {section.isNew && (
                                <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                                  <Sparkles className="h-3 w-3" />
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-600 mt-0.5">
                              {section.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Branding */}
          {currentStep === 'branding' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                  Customize Branding
                </h3>
                <p className="text-sm text-stone-600">
                  Add your company logo and colors to personalize the report
                </p>
              </div>

              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    Company Logo
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-8 hover:border-orange-400 hover:bg-orange-50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-stone-400" />
                          <p className="mt-2 text-sm font-medium text-stone-900">
                            Click to upload logo
                          </p>
                          <p className="text-xs text-stone-500">
                            PNG, JPG up to 2MB
                          </p>
                        </div>
                      </label>
                    </div>
                    {logoPreview && (
                      <div className="flex-shrink-0">
                        <div className="h-24 w-24 rounded-lg border border-stone-200 bg-white p-2">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label
                    htmlFor="companyName"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    Company Name (optional)
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={config.branding.companyName || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        branding: {
                          ...config.branding,
                          companyName: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="Your Company Name"
                  />
                </div>

                {/* Color Scheme */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="primaryColor"
                      className="mb-2 block text-sm font-medium text-stone-700"
                    >
                      Primary Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="primaryColor"
                        value={config.branding.primaryColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            branding: {
                              ...config.branding,
                              primaryColor: e.target.value,
                            },
                          })
                        }
                        className="h-10 w-16 rounded border border-stone-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.branding.primaryColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            branding: {
                              ...config.branding,
                              primaryColor: e.target.value,
                            },
                          })
                        }
                        className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="secondaryColor"
                      className="mb-2 block text-sm font-medium text-stone-700"
                    >
                      Secondary Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="secondaryColor"
                        value={config.branding.secondaryColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            branding: {
                              ...config.branding,
                              secondaryColor: e.target.value,
                            },
                          })
                        }
                        className="h-10 w-16 rounded border border-stone-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.branding.secondaryColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            branding: {
                              ...config.branding,
                              secondaryColor: e.target.value,
                            },
                          })
                        }
                        className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Settings */}
          {currentStep === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                  Report Settings
                </h3>
                <p className="text-sm text-stone-600">
                  Configure report metadata and formatting options
                </p>
              </div>

              <div className="space-y-6">
                {/* Report Title */}
                <div>
                  <label
                    htmlFor="reportTitle"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    Report Title
                  </label>
                  <input
                    type="text"
                    id="reportTitle"
                    value={config.settings.title}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        settings: {
                          ...config.settings,
                          title: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label
                    htmlFor="reportSubtitle"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    Subtitle (optional)
                  </label>
                  <input
                    type="text"
                    id="reportSubtitle"
                    value={config.settings.subtitle || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        settings: {
                          ...config.settings,
                          subtitle: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="e.g., Q4 2024 Workforce Analysis"
                  />
                </div>

                {/* Confidentiality Level */}
                <div>
                  <label
                    htmlFor="confidentiality"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    Confidentiality Level
                  </label>
                  <select
                    id="confidentiality"
                    value={config.settings.confidentialityLevel}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        settings: {
                          ...config.settings,
                          confidentialityLevel: e.target.value as any,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {CONFIDENTIALITY_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label} - {level.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Formatting Options */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-stone-700">
                    Formatting Options
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.settings.includeTableOfContents}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          settings: {
                            ...config.settings,
                            includeTableOfContents: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <span className="text-sm text-stone-900">
                        Include Table of Contents
                      </span>
                      <p className="text-xs text-stone-600">
                        Add a contents page at the beginning
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.settings.includePageNumbers}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          settings: {
                            ...config.settings,
                            includePageNumbers: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <span className="text-sm text-stone-900">
                        Include Page Numbers
                      </span>
                      <p className="text-xs text-stone-600">
                        Show page numbers in footer
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.settings.includeFooter}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          settings: {
                            ...config.settings,
                            includeFooter: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <span className="text-sm text-stone-900">
                        Include Footer
                      </span>
                      <p className="text-xs text-stone-600">
                        Add footer with confidentiality and date
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="border-t border-stone-200 bg-stone-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="text-xs text-stone-600">
              Step {currentStepIndex + 1} of {steps.length}
            </div>

            {canGoNext ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                <Download className="h-4 w-4" />
                Generate {config.format === 'pdf' ? 'PDF' : 'Excel'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
