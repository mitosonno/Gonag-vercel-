import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './gonag'
import InvitePage from './InvitePage'

function Root() {
  const path = window.location.pathname;
  const inviteMatch = path.match(/^\/invite\/([A-Z0-9]+)$/i);
  if (inviteMatch) {
    return React.createElement(InvitePage, {code: inviteMatch[1]});
  }
  return React.createElement(App);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null, React.createElement(Root))
)
