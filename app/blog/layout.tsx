import type {Metadata} from 'next';
export const metadata:Metadata={title:'Property journal',description:'Read published articles and perspectives on property in Sri Lanka.',alternates:{canonical:'/blog'}};
export default function Layout({children}:{children:React.ReactNode}){return children;}
