import { ParsedSubtitle } from './parser'

export interface TimingValidationOptions {
  maxDuration?: number // Maximum duration per subtitle in seconds (default: 5)
  maxCPS?: number // Maximum characters per second (default: 70)
  maxLines?: number // Maximum lines per subtitle (default: 2)
  minGap?: number // Minimum gap between subtitles in seconds (default: 0.042)
  maxCharactersPerLine?: number // Maximum characters per line (default: 42)
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  index: number
  subtitle?: ParsedSubtitle
  type: 'overlap' | 'duration' | 'cps' | 'lines' | 'format' | 'timing'
  message: string
}

export interface ValidationWarning {
  index: number
  subtitle?: ParsedSubtitle
  type: 'gap' | 'length' | 'readability'
  message: string
}

export class SRTValidator {
  private options: Required<TimingValidationOptions>

  constructor(options: TimingValidationOptions = {}) {
    this.options = {
      maxDuration: options.maxDuration ?? 5,
      maxCPS: options.maxCPS ?? 70,
      maxLines: options.maxLines ?? 2,
      minGap: options.minGap ?? 0.042,
      maxCharactersPerLine: options.maxCharactersPerLine ?? 42,
    }
  }

  /**
   * Validate raw SRT string format
   */
  validateRawSRT(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Basic SRT format validation
    const lines = content.trim().split('\n')
    let i = 0
    let subtitleCount = 0
    
    while (i < lines.length) {
      // Skip empty lines
      if (!lines[i]?.trim()) {
        i++
        continue
      }
      
      // Check subtitle index
      const index = lines[i]?.trim()
      if (!/^\d+$/.test(index || '')) {
        errors.push(`Line ${i + 1}: Invalid subtitle index "${index}"`)
      }
      subtitleCount++
      i++
      
      // Check timestamp line
      if (i >= lines.length) {
        errors.push(`Subtitle ${subtitleCount}: Missing timestamp`)
        break
      }
      
      const timestamp = lines[i]?.trim()
      if (!timestamp || !timestamp.includes(' --> ')) {
        errors.push(`Line ${i + 1}: Invalid timestamp format`)
      } else {
        const [start, end] = timestamp.split(' --> ')
        const timestampRegex = /^\d{2}:\d{2}:\d{2},\d{3}$/
        
        if (!timestampRegex.test(start?.trim() || '')) {
          errors.push(`Line ${i + 1}: Invalid start timestamp "${start}"`)
        }
        if (!timestampRegex.test(end?.trim() || '')) {
          errors.push(`Line ${i + 1}: Invalid end timestamp "${end}"`)
        }
      }
      i++
      
      // Check for subtitle text
      if (i >= lines.length || !lines[i]?.trim()) {
        errors.push(`Subtitle ${subtitleCount}: Missing text`)
      }
      
      // Skip text lines until empty line or next subtitle
      while (i < lines.length && lines[i]?.trim() && !/^\d+$/.test(lines[i]?.trim() || '')) {
        i++
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate parsed subtitles
   */
  validateSubtitles(subtitles: ParsedSubtitle[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i]
      if (!subtitle) continue
      
      const duration = (subtitle.end || 0) - (subtitle.start || 0)

      // Check duration
      if (duration > this.options.maxDuration) {
        errors.push({
          index: i,
          subtitle,
          type: 'duration',
          message: `Subtitle ${i + 1}: Duration ${duration.toFixed(2)}s exceeds maximum ${this.options.maxDuration}s`,
        })
      }

      // Check CPS (characters per second)
      const cps = subtitle.text.length / duration
      if (cps > this.options.maxCPS) {
        errors.push({
          index: i,
          subtitle,
          type: 'cps',
          message: `Subtitle ${i + 1}: Reading speed ${cps.toFixed(0)} CPS exceeds maximum ${this.options.maxCPS} CPS`,
        })
      }

      // Check line count
      const lines = subtitle.text.split('\n')
      if (lines.length > this.options.maxLines) {
        errors.push({
          index: i,
          subtitle,
          type: 'lines',
          message: `Subtitle ${i + 1}: ${lines.length} lines exceeds maximum ${this.options.maxLines}`,
        })
      }

      // Check line length
      for (const line of lines) {
        if (line.length > this.options.maxCharactersPerLine) {
          warnings.push({
            index: i,
            subtitle,
            type: 'length',
            message: `Subtitle ${i + 1}: Line "${line.substring(0, 20)}..." has ${line.length} characters (recommended max: ${this.options.maxCharactersPerLine})`,
          })
        }
      }

      // Check for overlaps with next subtitle
      if (i < subtitles.length - 1) {
        const nextSubtitle = subtitles[i + 1]
        if (nextSubtitle && subtitle.end && nextSubtitle.start) {
          const gap = nextSubtitle.start - subtitle.end
          
          if (gap < 0) {
            errors.push({
              index: i,
              subtitle,
              type: 'overlap',
              message: `Subtitle ${i + 1} overlaps with subtitle ${i + 2} by ${Math.abs(gap).toFixed(3)}s`,
            })
          } else if (gap < this.options.minGap) {
            warnings.push({
              index: i,
              subtitle,
              type: 'gap',
              message: `Gap between subtitle ${i + 1} and ${i + 2} is ${gap.toFixed(3)}s (recommended min: ${this.options.minGap}s)`,
            })
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Fix common timing issues
   */
  fixTimingIssues(subtitles: ParsedSubtitle[]): ParsedSubtitle[] {
    const fixed = [...subtitles]

    for (let i = 0; i < fixed.length; i++) {
      const subtitle = fixed[i]
      if (!subtitle) continue
      
      // Check minimum duration (Netflix: 0.833s minimum)
      const duration = (subtitle.end || 0) - (subtitle.start || 0)
      if (duration < 0.833 && subtitle.end) {
        subtitle.end = (subtitle.start || 0) + 0.833
      }

      // Fix overlaps
      if (i < fixed.length - 1) {
        const nextSubtitle = fixed[i + 1]
        if (nextSubtitle && subtitle.end && nextSubtitle.start && subtitle.end > nextSubtitle.start) {
          // Trim the current subtitle to end just before the next one
          subtitle.end = nextSubtitle.start - this.options.minGap
        }
      }
    }

    return fixed
  }

  /**
   * Validate timing for translation (accounts for text expansion)
   */
  validateTranslationTiming(
    original: ParsedSubtitle[],
    translated: ParsedSubtitle[],
    targetLanguage: string
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Language expansion factors (approximate)
    const expansionFactors: Record<string, number> = {
      'Spanish': 1.15,
      'French': 1.15,
      'German': 1.30,
      'Italian': 1.10,
      'Portuguese': 1.15,
      'Russian': 0.90,
      'Japanese': 0.80,
      'Chinese': 0.70,
      'Korean': 0.85,
      'Arabic': 0.95,
    }

    const expansionFactor = expansionFactors[targetLanguage] || 1.0

    for (let i = 0; i < Math.min(original.length, translated.length); i++) {
      const origSubtitle = original[i]
      const transSubtitle = translated[i]
      
      if (!origSubtitle || !transSubtitle) continue

      // Check if timing was preserved
      if (origSubtitle.startTime !== transSubtitle.startTime || origSubtitle.endTime !== transSubtitle.endTime) {
        errors.push({
          index: i,
          subtitle: transSubtitle,
          type: 'timing',
          message: `Subtitle ${i + 1}: Timing was modified during translation`,
        })
      }

      // Check if text expansion fits within timing
      const duration = (transSubtitle.end || 0) - (transSubtitle.start || 0)
      const expectedLength = origSubtitle.text.length * expansionFactor
      const actualLength = transSubtitle.text.length
      
      if (actualLength > expectedLength * 1.5) {
        warnings.push({
          index: i,
          subtitle: transSubtitle,
          type: 'readability',
          message: `Subtitle ${i + 1}: Translation significantly longer than expected (${actualLength} vs ${Math.round(expectedLength)} chars)`,
        })
      }

      // Recalculate CPS for translated text
      const cps = actualLength / duration
      if (cps > this.options.maxCPS) {
        warnings.push({
          index: i,
          subtitle: transSubtitle,
          type: 'readability',
          message: `Subtitle ${i + 1}: Translated text may be too fast to read (${cps.toFixed(0)} CPS)`,
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}