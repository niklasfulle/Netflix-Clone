import * as React from "react";

// Watch page is a complex component with multiple dependencies
// Static analysis-based tests to verify component structure and configuration

describe("Watch Page Component", () => {
  const fs = require("node:fs");
  const path = require("node:path");

  const getComponentSource = () => {
    const filePath = path.resolve(__dirname, "../page.tsx");
    return fs.readFileSync(filePath, "utf8");
  };

  describe("Basic Component Structure", () => {
    it("should export Watch component as default", () => {
      const source = getComponentSource();
      expect(source).toContain("export default Watch");
    });

    it("should be marked as use client", () => {
      const source = getComponentSource();
      expect(source).toContain('"use client"');
    });

    it("should be a functional component", () => {
      const source = getComponentSource();
      expect(source).toContain("const Watch = () =>");
    });

    it("should have no props", () => {
      const source = getComponentSource();
      expect(source).toMatch(/const Watch = \(\s*\) =>/);
    });
  });

  describe("Hooks Usage", () => {
    it("should use useParams hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useParams");
      expect(source).toContain("from \"next/navigation\"");
    });

    it("should extract movieId from params", () => {
      const source = getComponentSource();
      expect(source).toContain("const movieId = useParams<{ movieId: string }>().movieId");
    });

    it("should use useRouter hook", () => {
      const source = getComponentSource();
      expect(source).toContain("const router = useRouter()");
      expect(source).toContain("useRouter");
    });

    it("should use useSearchParams hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useSearchParams");
      expect(source).toContain("const searchParams = useSearchParams()");
    });

    it("should use useRef for video element", () => {
      const source = getComponentSource();
      expect(source).toContain("useRef");
      expect(source).toContain("const videoRef = useRef<HTMLVideoElement | null>(null)");
    });

    it("should use useMovie custom hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useMovie");
      expect(source).toContain("from \"@/hooks/movies/useMovie\"");
    });

    it("should destructure data from useMovie", () => {
      const source = getComponentSource();
      expect(source).toContain("const { data } = useMovie(movieId)");
    });

    it("should use useEffect hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useEffect");
    });
  });

  describe("Search Params Handling", () => {
    it("should get start parameter from search params", () => {
      const source = getComponentSource();
      expect(source).toContain('const search = searchParams.get("start")');
    });

    it("should check search param in useEffect", () => {
      const source = getComponentSource();
      expect(source).toMatch(/useEffect[\s\S]*?!search/);
    });
  });

  describe("Server Actions Import", () => {
    it("should import updateWatchTime action", () => {
      const source = getComponentSource();
      expect(source).toContain("from \"@/actions/watch/update-watch-time\"");
      expect(source).toContain("updateWatchTime");
    });

    it("should import addMovieView action", () => {
      const source = getComponentSource();
      expect(source).toContain("from \"@/actions/watch/add-movie-view\"");
      expect(source).toContain("addMovieView");
    });

    it("should import addToWatchlist action", () => {
      const source = getComponentSource();
      expect(source).toContain("from \"@/actions/watch/add-to-watchlist\"");
      expect(source).toContain("addToWatchlist");
    });
  });

  describe("Watch Time Management", () => {
    it("should define setMovieWatchTime function", () => {
      const source = getComponentSource();
      expect(source).toContain("async function setMovieWatchTime()");
    });

    it("should get video from ref in setMovieWatchTime", () => {
      const source = getComponentSource();
      expect(source).toMatch(/setMovieWatchTime[\s\S]*?const video = videoRef\.current/);
    });

    it("should call updateWatchTime with movieId and rounded time", () => {
      const source = getComponentSource();
      expect(source).toContain("updateWatchTime({ movieId, watchTime: Math.round(video.currentTime) })");
    });

    it("should check if video exists before updating", () => {
      const source = getComponentSource();
      expect(source).toMatch(/setMovieWatchTime[\s\S]*?if \(video\)/);
    });
  });

  describe("Video Time Restoration useEffect", () => {
    it("should restore watch time from data", () => {
      const source = getComponentSource();
      expect(source).toMatch(/useEffect\(\s*\(\) => {[\s\S]*?videoRef\.current\.currentTime = data\.watchTime/);
    });

    it("should check for videoRef, data.watchTime, and not search", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(videoRef\.current && data\?\.watchTime && !search\)/);
    });

    it("should depend on data.watchTime and search", () => {
      const source = getComponentSource();
      expect(source).toMatch(/useEffect\([\s\S]*?\[data\?\.watchTime, search\]/);
    });
  });

  describe("Initial Actions useEffect", () => {
    it("should call addMovieView on mount", () => {
      const source = getComponentSource();
      expect(source).toMatch(/useEffect[\s\S]*?addMovieView\({ movieId }\)/);
    });

    it("should call addToWatchlist on mount", () => {
      const source = getComponentSource();
      expect(source).toMatch(/useEffect[\s\S]*?addToWatchlist\({ movieId }\)/);
    });

    it("should check movieId before calling actions", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(movieId\)[\s\S]*?addMovieView/);
    });

    it("should have empty dependency array", () => {
      const source = getComponentSource();
      expect(source).toMatch(/addToWatchlist[\s\S]*?\[\]/);
    });

    it("should have eslint disable comment for exhaustive-deps", () => {
      const source = getComponentSource();
      expect(source).toContain("// eslint-disable-next-line react-hooks/exhaustive-deps");
    });
  });

  describe("Error State Rendering", () => {
    it("should check if data is falsy", () => {
      const source = getComponentSource();
      expect(source).toContain("if (!data)");
    });

    it("should render error screen when no data", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(!data\)[\s\S]*?return/);
    });

    it("should show Not found heading", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(!data\)[\s\S]*?Not found/);
    });

    it("should show error message about movie not found", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(!data\)[\s\S]*?The movie or series could not be found/);
    });

    it("should have Back to home button in error state", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(!data\)[\s\S]*?Back to home/);
    });

    it("should navigate to home on button click", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(!data\)[\s\S]*?router\.push\("\/"\)/);
    });
  });

  describe("Video Player Layout", () => {
    it("should render video element", () => {
      const source = getComponentSource();
      expect(source).toContain("<video");
    });

    it("should set video id to videoElement", () => {
      const source = getComponentSource();
      expect(source).toContain('id="videoElement"');
    });

    it("should enable autoplay", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<video[\s\S]*?autoPlay/);
    });

    it("should enable controls", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<video[\s\S]*?controls/);
    });

    it("should attach videoRef to video element", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<video[\s\S]*?ref={videoRef}/);
    });

    it("should set poster from data.thumbnailUrl", () => {
      const source = getComponentSource();
      expect(source).toContain("poster={data.thumbnailUrl}");
    });

    it("should have source element with video API", () => {
      const source = getComponentSource();
      expect(source).toContain("<source src={`/api/video/${movieId}`}");
    });

    it("should set video type to mp4", () => {
      const source = getComponentSource();
      expect(source).toContain('type="video/mp4"');
    });

    it("should have track element for captions", () => {
      const source = getComponentSource();
      expect(source).toContain('<track kind="captions"');
    });
  });

  describe("Auto-Save Functionality", () => {
    it("should have onTimeUpdate handler", () => {
      const source = getComponentSource();
      expect(source).toContain("onTimeUpdate=");
    });

    it("should check current time modulo 10", () => {
      const source = getComponentSource();
      expect(source).toMatch(/onTimeUpdate[\s\S]*?currentTime\) % 10 === 0/);
    });

    it("should call setMovieWatchTime every 10 seconds", () => {
      const source = getComponentSource();
      expect(source).toMatch(/onTimeUpdate[\s\S]*?setMovieWatchTime\(\)/);
    });

    it("should check videoRef.current exists in onTimeUpdate", () => {
      const source = getComponentSource();
      expect(source).toMatch(/onTimeUpdate[\s\S]*?if \(videoRef\.current/);
    });

    it("should use Math.floor for time comparison", () => {
      const source = getComponentSource();
      expect(source).toMatch(/onTimeUpdate[\s\S]*?Math\.floor\(videoRef\.current\.currentTime\)/);
    });

    it("should have comment about auto-save every 10 seconds", () => {
      const source = getComponentSource();
      expect(source).toContain("// Auto-save alle 10 Sekunden");
    });
  });

  describe("Navigation Header", () => {
    it("should import FaArrowLeft icon", () => {
      const source = getComponentSource();
      expect(source).toContain("from \"react-icons/fa\"");
      expect(source).toContain("FaArrowLeft");
    });

    it("should render nav element", () => {
      const source = getComponentSource();
      expect(source).toContain("<nav");
    });

    it("should render FaArrowLeft component", () => {
      const source = getComponentSource();
      expect(source).toContain("<FaArrowLeft");
    });

    it("should set arrow icon size to 40", () => {
      const source = getComponentSource();
      expect(source).toContain("<FaArrowLeft");
      expect(source).toContain("size={40}");
    });

    it("should call setMovieWatchTime on arrow click", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<FaArrowLeft[\s\S]*?onClick[\s\S]*?setMovieWatchTime\(\)/);
    });

    it("should navigate to home after saving watch time", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<FaArrowLeft[\s\S]*?onClick[\s\S]*?router\.push\("\/"\)/);
    });

    it("should display Watching label", () => {
      const source = getComponentSource();
      expect(source).toContain("Watching:");
    });

    it("should display movie title from data", () => {
      const source = getComponentSource();
      expect(source).toMatch(/Watching:[\s\S]*?{data\?\.title}/);
    });
  });

  describe("Styling Classes", () => {
    it("should apply full screen classes to main container", () => {
      const source = getComponentSource();
      expect(source).toContain("w-screen h-screen bg-black");
    });

    it("should apply fixed positioning to nav", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<nav[\s\S]*?fixed/);
    });

    it("should apply z-index to nav", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<nav[\s\S]*?z-10/);
    });

    it("should apply background opacity to nav", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<nav[\s\S]*?bg-opacity-70/);
    });

    it("should apply full width and height to video", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<video[\s\S]*?w-full h-full/);
    });

    it("should style error container", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(!data\)[\s\S]*?w-screen h-screen/);
    });
  });

  describe("Error State Styling", () => {
    it("should center error content", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(!data\)[\s\S]*?flex items-center justify-center/);
    });

    it("should apply black background to error screen", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(!data\)[\s\S]*?bg-black/);
    });

    it("should style error heading", () => {
      const source = getComponentSource();
      expect(source).toContain("Not found");
      expect(source).toContain("text-3xl");
      expect(source).toContain("text-white");
      expect(source).toContain("font-bold");
    });

    it("should style error message", () => {
      const source = getComponentSource();
      expect(source).toContain("could not be found");
      expect(source).toContain("text-zinc-400");
    });

    it("should style back button", () => {
      const source = getComponentSource();
      expect(source).toContain("Back to home");
      expect(source).toContain("bg-red-600");
    });
  });

  describe("Navigation Styling", () => {
    it("should apply responsive top positioning", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<nav[\s\S]*?top-8 sm:top-0/);
    });

    it("should apply gap between nav items", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<nav[\s\S]*?gap-8/);
    });

    it("should apply padding to nav", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<nav[\s\S]*?p-4/);
    });

    it("should style arrow icon as clickable", () => {
      const source = getComponentSource();
      expect(source).toMatch(/FaArrowLeft[\s\S]*?cursor-pointer/);
    });

    it("should apply responsive text size to title", () => {
      const source = getComponentSource();
      expect(source).toContain("Watching:");
      expect(source).toContain("text-xl xl:text-3xl");
    });
  });

  describe("Type Safety", () => {
    it("should type useParams with movieId string", () => {
      const source = getComponentSource();
      expect(source).toContain("useParams<{ movieId: string }>");
    });

    it("should type videoRef as HTMLVideoElement", () => {
      const source = getComponentSource();
      expect(source).toContain("useRef<HTMLVideoElement | null>");
    });

    it("should use optional chaining for data properties", () => {
      const source = getComponentSource();
      expect(source).toContain("data?.watchTime");
      expect(source).toContain("data?.title");
    });
  });

  describe("Component Imports", () => {
    it("should import React and hooks", () => {
      const source = getComponentSource();
      expect(source).toContain('import React, { useRef, useEffect }');
      expect(source).toContain('from "react"');
    });

    it("should import Next.js navigation hooks", () => {
      const source = getComponentSource();
      expect(source).toContain("import { useParams, useRouter, useSearchParams }");
    });

    it("should import all required server actions", () => {
      const source = getComponentSource();
      expect(source).toContain("@/actions/watch/update-watch-time");
      expect(source).toContain("@/actions/watch/add-movie-view");
      expect(source).toContain("@/actions/watch/add-to-watchlist");
    });
  });

  describe("Video Configuration", () => {
    it("should configure video element with all attributes", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<video[\s\S]*?id[\s\S]*?autoPlay[\s\S]*?controls[\s\S]*?ref[\s\S]*?poster/);
    });

    it("should set video source dynamically with movieId", () => {
      const source = getComponentSource();
      expect(source).toContain("/api/video/${movieId}");
    });

    it("should include accessibility track", () => {
      const source = getComponentSource();
      expect(source).toContain("<track");
    });
  });

  describe("Function Definitions", () => {
    it("should define setMovieWatchTime as async function", () => {
      const source = getComponentSource();
      expect(source).toContain("async function setMovieWatchTime()");
    });

    it("should use Math.round for watch time precision", () => {
      const source = getComponentSource();
      expect(source).toContain("Math.round(video.currentTime)");
    });
  });

  describe("Conditional Logic", () => {
    it("should check data before rendering main content", () => {
      const source = getComponentSource();
      expect(source).toContain("if (!data)");
    });

    it("should check video ref before operations", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(video\)/);
    });

    it("should check conditions in useEffect", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(videoRef\.current && data\?\.watchTime && !search\)/);
    });
  });

  describe("Layout Structure", () => {
    it("should wrap video player in container div", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<div className="w-screen h-screen bg-black">[\s\S]*?<video/);
    });

    it("should render nav before video", () => {
      const source = getComponentSource();
      const navIndex = source.indexOf("<nav");
      const videoIndex = source.indexOf("<video");
      expect(navIndex).toBeGreaterThan(0);
      expect(videoIndex).toBeGreaterThan(navIndex);
    });

    it("should have error state as separate return", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(!data\) {[\s\S]*?return[\s\S]*?}/);
    });
  });

  describe("Text Content", () => {
    it("should display Watching prefix", () => {
      const source = getComponentSource();
      expect(source).toContain("Watching:");
    });

    it("should have font-light on prefix", () => {
      const source = getComponentSource();
      expect(source).toContain("Watching:");
      expect(source).toContain("font-light");
    });

    it("should display movie title after prefix", () => {
      const source = getComponentSource();
      expect(source).toMatch(/Watching:[\s\S]*?{data\?\.title}/);
    });
  });

  describe("Button Configuration", () => {
    it("should have onClick handler for back button", () => {
      const source = getComponentSource();
      expect(source).toMatch(/Back to home[\s\S]*?onClick/);
    });

    it("should have hover effect on back button", () => {
      const source = getComponentSource();
      expect(source).toContain("Back to home");
      expect(source).toContain("hover:bg-red-800");
    });

    it("should have transition on back button", () => {
      const source = getComponentSource();
      expect(source).toContain("Back to home");
      expect(source).toContain("transition-all");
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive nav positioning", () => {
      const source = getComponentSource();
      expect(source).toContain("top-8 sm:top-0");
    });

    it("should have responsive title text size", () => {
      const source = getComponentSource();
      expect(source).toContain("text-xl xl:text-3xl");
    });

    it("should use flex layout for nav", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<nav[\s\S]*?flex flex-row/);
    });
  });

  describe("Video Event Handlers", () => {
    it("should define onTimeUpdate handler", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<video[\s\S]*?onTimeUpdate={/);
    });

    it("should use arrow function in onTimeUpdate", () => {
      const source = getComponentSource();
      expect(source).toMatch(/onTimeUpdate={\(\) => {/);
    });
  });
});
