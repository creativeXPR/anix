import { CUSTOM_PROMPT_MAX, GAMES, gameGradientVars } from '../games.js'
import './GamePicker.css'

// "pick a game" grid: each option is a mini NGL card (gradient band with
// the game's title over its prompt). Picking `custom` reveals a prompt
// input. Controlled: `value` = game key, `customPrompt` = custom text.
export default function GamePicker({ value, customPrompt, onChange, onCustomPromptChange, disabled }) {
  return (
    <div>
      <p className="section-label">pick a game</p>
      <div className="game-picker" role="radiogroup" aria-label="Game">
        {Object.entries(GAMES).map(([key, game]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            className="game-picker__option"
            style={gameGradientVars(key)}
            onClick={() => onChange(key)}
            disabled={disabled}
          >
            <span className={`game-title${game.loud ? ' game-title--loud' : ''}`}>{game.title}</span>
            <small>{key === 'custom' ? 'write your own prompt' : game.prompt}</small>
          </button>
        ))}
      </div>
      {value === 'custom' && (
        <input
          className="field game-picker__custom"
          value={customPrompt}
          onChange={(event) => onCustomPromptChange(event.target.value)}
          placeholder="your prompt, e.g. rate my new hair 💇"
          aria-label="Custom prompt"
          maxLength={CUSTOM_PROMPT_MAX}
          disabled={disabled}
        />
      )}
    </div>
  )
}
