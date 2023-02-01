import { VideoHTMLAttributes, useEffect, useRef, useCallback } from 'react'

declare global {
  interface IProps {
    srcObject?: MediaStream;
    autoPlay?: boolean;
  }
}

export function Video({ srcObject, autoPlay = false }: VideoHTMLAttributes<HTMLVideoElement> & IProps): JSX.Element {
  const refVideo = useCallback((node: HTMLVideoElement) => {
    if (node && srcObject) node.srcObject = srcObject;
  }, [srcObject])

  return <><video autoPlay ref={refVideo} /></>
}

export default Video;