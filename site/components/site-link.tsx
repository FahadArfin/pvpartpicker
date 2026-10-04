import type {AnchorHTMLAttributes} from 'react';
// Progressive page navigation avoids the beta framework's production RSC
// namespace-export failure. Device drafts and comparisons persist in the provider.
export default function SiteLink(props:AnchorHTMLAttributes<HTMLAnchorElement>) { return <a {...props}/>; }
