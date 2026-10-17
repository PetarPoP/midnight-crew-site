import React from 'react'

/** Wordmark for the login page. Same as the site footer: MC hexagon and MIDNIGHT CREW. */
export default function Logo() {
  return (
    <div className="mc-logo" aria-label="Midnight Crew CMS">
      <span className="mc-hex">MC</span>
      <span className="mc-logo__mark">
        Midnight <span className="mc-logo__crew">Crew</span>
      </span>
      <span className="mc-logo__sub">CMS · Livno</span>
    </div>
  )
}
