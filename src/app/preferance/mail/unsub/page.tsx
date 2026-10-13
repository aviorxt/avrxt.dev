import PreferenceClient from './PreferenceClient';
export default function MissingPreferenceLink() { return <PreferenceClient initial={{ state: 'unavailable' }} />; }
