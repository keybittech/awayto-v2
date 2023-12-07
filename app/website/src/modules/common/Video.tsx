import { VideoHTMLAttributes, useCallback } from 'react'

declare global {
  interface IProps {
    srcObject?: MediaStream;
    autoPlay?: boolean;
  }
}

export function Video({ srcObject, autoPlay = false }: VideoHTMLAttributes<HTMLVideoElement> & IProps): React.JSX.Element {
  const refVideo = useCallback((node: HTMLVideoElement) => {
    if (node && srcObject) node.srcObject = srcObject;
  }, [srcObject])

  return <video style={{ height: '100%', maxWidth: '100%' }} controls { ...{ autoPlay }} ref={refVideo} />
}

export default Video;
