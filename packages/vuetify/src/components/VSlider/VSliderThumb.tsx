import './VSliderThumb.sass'
import { useBackgroundColor, useTextColor } from '@/composables/color'
import { useRtl } from '@/composables/rtl'
import { convertToUnit, defineComponent, keyCodes } from '@/util'
import { computed, inject } from 'vue'
import { VScaleTransition } from '../transitions'
import { VSliderSymbol } from './VSlider'

export default defineComponent({
  name: 'VSliderThumb',

  props: {
    active: Boolean,
    focused: Boolean,
    dirty: Boolean,
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
    modelValue: {
      type: Number,
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
  },

  emits: {
    'update:thumbPressed': (v: boolean) => true,
    'update:keyPressed': (v: boolean) => true,
    'update:modelValue': (v: number) => true,
  },

  setup (props, { slots, attrs, emit }) {
    const { isRtl } = useRtl()
    const slider = inject(VSliderSymbol)

    if (!slider) throw new Error('[Vuetify] v-slider-thumb must be used inside v-slider or v-range-slider')

    const { thumbColor, stepSize, vertical, disabled, thumbSize, showLabel, transition, direction } = slider

    const { textColorClasses, textColorStyles } = useTextColor(thumbColor)
    const { backgroundColorClasses, backgroundColorStyles } = useBackgroundColor(thumbColor)

    let keyPresses = 0

    function parseKeydown (e: KeyboardEvent, value: number) {
      // e.preventDefault()
      // if (!this.isInteractive) return

      const { pageup, pagedown, end, home, left, right, down, up } = keyCodes

      if (![pageup, pagedown, end, home, left, right, down, up].includes(e.keyCode)) return

      const step = stepSize.value || 1
      const steps = (props.max - props.min) / step
      if ([left, right, down, up].includes(e.keyCode)) {
        const increase = isRtl.value ? [left, up] : [right, up]
        const direction = increase.includes(e.keyCode) ? 1 : -1
        const multiplier = e.shiftKey ? 3 : (e.ctrlKey ? 2 : 1)

        value = value + (direction * step * multiplier)
      } else if (e.keyCode === home) {
        value = props.min
      } else if (e.keyCode === end) {
        value = props.max
      } else {
        const direction = e.keyCode === pagedown ? 1 : -1
        value = value - (direction * step * (steps > 100 ? steps / 10 : 10))
      }

      return Math.max(props.min, Math.min(props.max, value))
    }

    function onKeydown (e: KeyboardEvent) {
      keyPresses += 1

      keyPresses > 1 && emit('update:keyPressed', true)

      const newValue = parseKeydown(e, props.modelValue)

      newValue != null && emit('update:modelValue', newValue)
    }

    function onKeyup (e: KeyboardEvent) {
      keyPresses = 0
      emit('update:keyPressed', false)
    }

    return () => {
      const positionPercentage = convertToUnit(vertical.value ? 100 - props.position : props.position, '%')
      const inset = vertical.value ? 'block' : 'inline'
      const size = convertToUnit(thumbSize.value)
      const transform = vertical.value
        ? `translateY(20%) translateY(${(thumbSize.value / 3) - 1}px) translateX(55%) rotate(135deg)`
        : `translateY(-20%) translateY(-6px) translateX(0%) rotate(45deg)`

      return (
        <div
          class={[
            'v-slider-thumb',
            {
              'v-slider-thumb--active': props.active,
              'v-slider-thumb--focused': props.focused,
              'v-slider-thumb--dirty': props.dirty,
              'v-slider-thumb--show-label': !disabled.value && !!(showLabel.value || slots['thumb-label']),
              // 'v-slider-thumb--pressed': props.pressed,
            },
          ]}
          style={{
            transition: transition.value,
            [`inset-${inset}-start`]: `calc(${positionPercentage} - var(--v-slider-thumb-size) / 2)`,
            '--v-slider-thumb-size': convertToUnit(disabled.value ? thumbSize.value / 2 : thumbSize.value),
          }}
          role="slider"
          tabindex={disabled.value ? -1 : 0}
          aria-label={props.label}
          aria-valuemin={props.min}
          aria-valuemax={props.max}
          aria-valuenow={props.modelValue}
          // aria-readonly={props.readonly}
          aria-orientation={direction.value}
          // onFocus={slotProps.onFocus}
          // onBlur={slotProps.onBlur}
          onKeydown={onKeydown}
          onKeyup={onKeyup}
        >
          <div
            onMousedown={() => emit('update:thumbPressed', true)}
            onMouseup={() => emit('update:thumbPressed', false)}
            class={[
              'v-slider-thumb__surface',
              textColorClasses.value,
            ]}
            style={textColorStyles.value}
          />
          {showLabel.value && (
            <VScaleTransition origin="bottom center">
              <div
                class="v-slider-thumb__label-container"
                v-show={props.focused || props.active || showLabel.value}
              >
                <div
                  class={[
                    'v-slider-thumb__label',
                    backgroundColorClasses.value,
                  ]}
                  style={{
                    height: size,
                    width: size,
                    transform,
                    ...backgroundColorStyles.value,
                  }}
                >
                  <div>
                    {slots['thumb-label']?.({ value: props.modelValue }) ?? props.modelValue}
                  </div>
                </div>
              </div>
            </VScaleTransition>
          )}
        </div>
      )
    }
  },
})