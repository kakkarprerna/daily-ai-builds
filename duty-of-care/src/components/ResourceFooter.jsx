export default function ResourceFooter() {
  return (
    <div className="resources">
      <div className="resources-title">If things feel urgent right now</div>
      <div className="resources-sub">
        These are here regardless of what any tool tells you. Free, confidential, and staffed by real people.
      </div>
      <div className="resource-list">
        <div className="resource-item">
          <strong>Emergency services</strong>
          112 across the EU, 911 in the US. Call if someone is in immediate physical danger.
        </div>
        <div className="resource-item">
          <strong>988 Suicide &amp; Crisis Lifeline</strong>
          Call or text 988 in the US. Talk or chat, any time.
        </div>
        <div className="resource-item">
          <strong>Crisis Text Line</strong>
          Text HOME to 741741 (US, Canada, UK).
        </div>
        <div className="resource-item">
          <strong>Samaritans</strong>
          116 123, free, UK and Ireland, any time.
        </div>
        <div className="resource-item">
          <strong>Find a helpline</strong>
          <a href="https://findahelpline.com" target="_blank" rel="noreferrer">findahelpline.com</a> lists local lines for most other countries.
        </div>
      </div>
    </div>
  )
}
