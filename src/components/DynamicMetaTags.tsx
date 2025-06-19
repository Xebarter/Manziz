import { useMetaTags } from '../hooks/useMetaTags'

const DynamicMetaTags: React.FC = () => {
  // Use the hook to automatically fetch the first menu item and update meta tags
  useMetaTags({ useFirstMenuItem: true })

  return null // This component doesn't render anything
}

export default DynamicMetaTags 