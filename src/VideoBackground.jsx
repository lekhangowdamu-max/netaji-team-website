
import "./VideoBackground.css";

export default function VideoBackground() {
  return (
    <div className="video-background" aria-hidden="true">
      <video autoPlay muted loop playsInline preload="auto">
        <source
          src="/team-background.mp4"
          type="video/mp4"
        />
      </video>

      <div className="video-overlay"></div>
    </div>
  );
}
