// Real, current resources, checked before adding rather than assumed.
// These are about the conversation and the tech itself, separate from the
// crisis resources in ResourceFooter, which cover acute safety.

const LINKS = [
  {
    org: 'Common Sense Media',
    title: 'AI Chatbots and Your Child: Age and Stage Guidance',
    url: 'https://www.commonsensemedia.org/articles/ai-chatbots-and-your-child-age-and-stage-guidance',
  },
  {
    org: 'Internet Matters',
    title: 'AI chatbots and companions: how parents can keep children safe',
    url: 'https://www.internetmatters.org/resources/ai-chatbots-and-virtual-friends-how-parents-can-keep-children-safe/',
  },
  {
    org: 'Child Mind Institute',
    title: 'How to Communicate With Teenagers',
    url: 'https://childmind.org/article/tips-communicating-with-teen/',
  },
  {
    org: 'Child Mind Institute',
    title: "How to Talk to a Teen Who Won't Talk",
    url: 'https://childmind.org/article/help-my-teen-stopped-talking-to-me/',
  },
]

export default function CommunicationResources() {
  return (
    <div className="resources" style={{ borderTopColor: 'var(--line)' }}>
      <div className="resources-title">Keep the conversation going</div>
      <div className="resources-sub">
        For after this first talk, on the tech itself and on staying open with a kid who has started pulling away.
      </div>
      <div className="resource-list">
        {LINKS.map((l) => (
          <div className="resource-item" key={l.url}>
            <strong>{l.org}</strong>
            <a href={l.url} target="_blank" rel="noreferrer">{l.title}</a>
          </div>
        ))}
      </div>
    </div>
  )
}
