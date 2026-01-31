import * as React from "react";

// Watch Playlist page is a complex component with multiple dependencies
// Static analysis-based tests to verify component structure and configuration

describe("Watch Playlist Page Component", () => {
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

    it("should extract playlistId from params", () => {
      const source = getComponentSource();
      expect(source).toContain("const playlistId = useParams<{ playlistId: string }>().playlistId");
    });

    it("should use useRouter hook", () => {
      const source = getComponentSource();
      expect(source).toContain("const router = useRouter()");
      expect(source).toContain("useRouter");
    });

    it("should use useRef for video element", () => {
      const source = getComponentSource();
      expect(source).toContain("useRef");
      expect(source).toContain("const videoRef = useRef<HTMLVideoElement | null>(null)");
    });

    it("should use usePlaylist custom hook", () => {
      const source = getComponentSource();
      expect(source).toContain("usePlaylist");
      expect(source).toContain("from \"@/hooks/playlists/usePlaylist\"");
    });

    it("should destructure data as playlist from usePlaylist", () => {
      const source = getComponentSource();
      expect(source).toContain("const { data: playlist } = usePlaylist(playlistId)");
    });

    it("should use useState for currentMovie", () => {
      const source = getComponentSource();
      expect(source).toContain("useState");
      expect(source).toContain("const [currentMovie, setCurrentMovie] = useState<number>(0)");
    });

    it("should use React.useEffect", () => {
      const source = getComponentSource();
      expect(source).toContain("React.useEffect");
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

  describe("Icon Imports", () => {
    it("should import FaArrowLeft icon", () => {
      const source = getComponentSource();
      expect(source).toContain("from \"react-icons/fa\"");
      expect(source).toContain("FaArrowLeft");
    });

    it("should import FaArrowRight icon", () => {
      const source = getComponentSource();
      expect(source).toContain("FaArrowRight");
    });

    it("should import both arrow icons together", () => {
      const source = getComponentSource();
      expect(source).toContain("import { FaArrowLeft, FaArrowRight }");
    });
  });

  describe("Watch Time Management", () => {
    it("should define setMovieWatchTime function", () => {
      const source = getComponentSource();
      expect(source).toContain("async function setMovieWatchTime()");
    });

    it("should get video element by ID", () => {
      const source = getComponentSource();
      expect(source).toContain('const video = document.getElementById("videoElement") as HTMLVideoElement');
    });

    it("should get movieId from current playlist item", () => {
      const source = getComponentSource();
      expect(source).toContain("const movieId = playlist?.movies[currentMovie]?.id");
    });

    it("should call updateWatchTime with movieId and rounded time", () => {
      const source = getComponentSource();
      expect(source).toContain("updateWatchTime({ movieId, watchTime: Math.round(video.currentTime) })");
    });

    it("should check if movieId and video exist before updating", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(movieId && video\)/);
    });
  });

  describe("UpdateMovie Function", () => {
    it("should define updateMovie function with dir parameter", () => {
      const source = getComponentSource();
      expect(source).toContain("const updateMovie = (dir: number) =>");
    });

    it("should check if playlist movies exist", () => {
      const source = getComponentSource();
      expect(source).toContain("if (!playlist?.movies) return");
    });

    it("should calculate new index", () => {
      const source = getComponentSource();
      expect(source).toContain("const newIndex = currentMovie + dir");
    });

    it("should validate new index is within bounds", () => {
      const source = getComponentSource();
      expect(source).toContain("if (newIndex >= 0 && newIndex < playlist.movies.length)");
    });

    it("should call setCurrentMovie with newIndex", () => {
      const source = getComponentSource();
      expect(source).toContain("setCurrentMovie(newIndex)");
    });
  });

  describe("Video Ended Handler", () => {
    it("should define handleVideoEnded function", () => {
      const source = getComponentSource();
      expect(source).toContain("const handleVideoEnded = () =>");
    });

    it("should call setMovieWatchTime on video end", () => {
      const source = getComponentSource();
      expect(source).toMatch(/handleVideoEnded[\s\S]*?setMovieWatchTime\(\)/);
    });

    it("should call updateMovie with 1 to advance", () => {
      const source = getComponentSource();
      expect(source).toMatch(/handleVideoEnded[\s\S]*?updateMovie\(1\)/);
    });
  });

  describe("useEffect for Movie Actions", () => {
    it("should get movieId from current playlist item", () => {
      const source = getComponentSource();
      expect(source).toMatch(/React\.useEffect[\s\S]*?const movieId = playlist\?\.movies\?\.\[currentMovie\]\?\.id/);
    });

    it("should call addMovieView when movieId changes", () => {
      const source = getComponentSource();
      expect(source).toMatch(/React\.useEffect[\s\S]*?addMovieView\({ movieId }\)/);
    });

    it("should call addToWatchlist when movieId changes", () => {
      const source = getComponentSource();
      expect(source).toMatch(/React\.useEffect[\s\S]*?addToWatchlist\({ movieId }\)/);
    });

    it("should check if movieId exists before calling actions", () => {
      const source = getComponentSource();
      expect(source).toMatch(/React\.useEffect[\s\S]*?if \(movieId\)/);
    });

    it("should depend on currentMovie and playlist", () => {
      const source = getComponentSource();
      expect(source).toMatch(/React\.useEffect[\s\S]*?\[currentMovie, playlist\]/);
    });
  });

  describe("Helper Variables", () => {
    it("should define hasMultiple variable", () => {
      const source = getComponentSource();
      expect(source).toContain("const hasMultiple = playlist?.movies?.length > 1");
    });

    it("should define current variable", () => {
      const source = getComponentSource();
      expect(source).toContain("const current = playlist?.movies?.[currentMovie]");
    });
  });

  describe("Navigation Header", () => {
    it("should render nav element", () => {
      const source = getComponentSource();
      expect(source).toContain("<nav");
    });

    it("should render FaArrowLeft component in nav", () => {
      const source = getComponentSource();
      expect(source).toContain("<FaArrowLeft");
    });

    it("should set arrow icon size to 40", () => {
      const source = getComponentSource();
      expect(source).toContain("size={40}");
    });

    it("should call setMovieWatchTime on back arrow click", () => {
      const source = getComponentSource();
      expect(source).toMatch(/FaArrowLeft[\s\S]*?onClick[\s\S]*?setMovieWatchTime\(\)/);
    });

    it("should navigate to playlists page on back", () => {
      const source = getComponentSource();
      expect(source).toContain('router.push("/playlists")');
    });

    it("should display Watching label", () => {
      const source = getComponentSource();
      expect(source).toContain("Watching:");
    });

    it("should display current movie title", () => {
      const source = getComponentSource();
      expect(source).toContain("{current?.title}");
    });
  });

  describe("Next Button - First Movie", () => {
    it("should render next button when on first movie", () => {
      const source = getComponentSource();
      expect(source).toContain("{hasMultiple && currentMovie === 0 &&");
    });

    it("should call updateMovie(1) on next button click", () => {
      const source = getComponentSource();
      expect(source).toMatch(/currentMovie === 0[\s\S]*?onClick=\{\(\) => updateMovie\(1\)\}/);
    });

    it("should render FaArrowRight in next button", () => {
      const source = getComponentSource();
      expect(source).toMatch(/currentMovie === 0[\s\S]*?<FaArrowRight/);
    });

    it("should position next button on right", () => {
      const source = getComponentSource();
      expect(source).toMatch(/currentMovie === 0[\s\S]*?-right-1/);
    });
  });

  describe("Navigation Buttons - Middle Movies", () => {
    it("should render both buttons when in middle of playlist", () => {
      const source = getComponentSource();
      expect(source).toContain("currentMovie > 0 && currentMovie < playlist.movies.length - 1");
    });

    it("should render previous button in middle", () => {
      const source = getComponentSource();
      expect(source).toMatch(/currentMovie > 0 && currentMovie < playlist\.movies\.length - 1[\s\S]*?onClick=\{\(\) => updateMovie\(-1\)\}/);
    });

    it("should render next button in middle", () => {
      const source = getComponentSource();
      expect(source).toMatch(/currentMovie > 0 && currentMovie < playlist\.movies\.length - 1[\s\S]*?onClick=\{\(\) => updateMovie\(1\)\}/);
    });

    it("should position previous button on left", () => {
      const source = getComponentSource();
      expect(source).toMatch(/currentMovie > 0 && currentMovie < playlist\.movies\.length - 1[\s\S]*?-left-1/);
    });
  });

  describe("Previous Button - Last Movie", () => {
    it("should render previous button when on last movie", () => {
      const source = getComponentSource();
      expect(source).toContain("currentMovie === playlist.movies.length - 1");
    });

    it("should call updateMovie(-1) on previous button click", () => {
      const source = getComponentSource();
      expect(source).toMatch(/currentMovie === playlist\.movies\.length - 1[\s\S]*?onClick=\{\(\) => updateMovie\(-1\)\}/);
    });

    it("should render FaArrowLeft in previous button", () => {
      const source = getComponentSource();
      expect(source).toMatch(/currentMovie === playlist\.movies\.length - 1[\s\S]*?<FaArrowLeft/);
    });

    it("should position previous button on left", () => {
      const source = getComponentSource();
      expect(source).toMatch(/currentMovie === playlist\.movies\.length - 1[\s\S]*?-left-1/);
    });
  });

  describe("Video Player", () => {
    it("should conditionally render video based on current.id", () => {
      const source = getComponentSource();
      expect(source).toContain("{current?.id &&");
    });

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
      expect(source).toContain("autoPlay");
    });

    it("should enable controls", () => {
      const source = getComponentSource();
      expect(source).toContain("controls");
    });

    it("should attach videoRef to video element", () => {
      const source = getComponentSource();
      expect(source).toContain("ref={videoRef}");
    });

    it("should set poster from current.thumbnailUrl", () => {
      const source = getComponentSource();
      expect(source).toContain("poster={current.thumbnailUrl}");
    });

    it("should have onEnded handler", () => {
      const source = getComponentSource();
      expect(source).toContain("onEnded={handleVideoEnded}");
    });

    it("should have source element with video API", () => {
      const source = getComponentSource();
      expect(source).toContain("<source src={`/api/video/${current.id}`}");
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
      expect(source).toContain("currentTime) % 10 === 0");
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
      expect(source).toContain("Math.floor(videoRef.current.currentTime)");
    });

    it("should have comment about auto-save every 10 seconds", () => {
      const source = getComponentSource();
      expect(source).toContain("// Auto-save alle 10 Sekunden");
    });
  });

  describe("Styling Classes", () => {
    it("should apply full screen classes to main container", () => {
      const source = getComponentSource();
      expect(source).toContain("w-screen h-screen bg-black relative");
    });

    it("should apply fixed positioning to nav", () => {
      const source = getComponentSource();
      expect(source).toContain("fixed top-8 sm:top-0");
    });

    it("should apply z-index to nav", () => {
      const source = getComponentSource();
      expect(source).toContain("z-10");
    });

    it("should apply background opacity to nav", () => {
      const source = getComponentSource();
      expect(source).toContain("bg-opacity-70");
    });

    it("should apply full width and height to video", () => {
      const source = getComponentSource();
      expect(source).toContain("w-full h-full");
    });
  });

  describe("Navigation Button Styling", () => {
    it("should style navigation buttons with fixed positioning", () => {
      const source = getComponentSource();
      expect(source).toContain("fixed z-10");
    });

    it("should apply bottom positioning to nav buttons", () => {
      const source = getComponentSource();
      expect(source).toContain("bottom-[20%]");
    });

    it("should apply responsive size to nav buttons", () => {
      const source = getComponentSource();
      expect(source).toContain("h-10 w-12 xl:h-16 xl:w-20");
    });

    it("should apply rounded corners to right button", () => {
      const source = getComponentSource();
      expect(source).toContain("rounded-tl-xl rounded-bl-xl");
    });

    it("should apply rounded corners to left button", () => {
      const source = getComponentSource();
      expect(source).toContain("rounded-tr-xl rounded-br-xl");
    });

    it("should apply border to nav buttons", () => {
      const source = getComponentSource();
      expect(source).toContain("border-[1px] border-white");
    });
  });

  describe("Responsive Arrow Icons", () => {
    it("should render large arrow for xl screens", () => {
      const source = getComponentSource();
      expect(source).toContain("xl:block hidden");
      expect(source).toContain("size={45}");
    });

    it("should render small arrow for mobile screens", () => {
      const source = getComponentSource();
      expect(source).toContain("block xl:hidden");
      expect(source).toContain("size={26}");
    });

    it("should apply hover effect to arrows", () => {
      const source = getComponentSource();
      expect(source).toContain("hover:text-neutral-300");
    });

    it("should apply transition to arrows", () => {
      const source = getComponentSource();
      expect(source).toContain("transition-all ease-in");
    });
  });

  describe("Type Safety", () => {
    it("should type useParams with playlistId string", () => {
      const source = getComponentSource();
      expect(source).toContain("useParams<{ playlistId: string }>");
    });

    it("should type videoRef as HTMLVideoElement", () => {
      const source = getComponentSource();
      expect(source).toContain("useRef<HTMLVideoElement | null>");
    });

    it("should type currentMovie state as number", () => {
      const source = getComponentSource();
      expect(source).toContain("useState<number>(0)");
    });

    it("should type dir parameter as number", () => {
      const source = getComponentSource();
      expect(source).toContain("(dir: number)");
    });

    it("should use optional chaining for playlist properties", () => {
      const source = getComponentSource();
      expect(source).toContain("playlist?.movies");
      expect(source).toContain("current?.title");
      expect(source).toContain("current?.id");
    });
  });

  describe("Component Imports", () => {
    it("should import React and hooks", () => {
      const source = getComponentSource();
      expect(source).toContain('import React, { useRef, useState }');
      expect(source).toContain('from "react"');
    });

    it("should import Next.js navigation hooks", () => {
      const source = getComponentSource();
      expect(source).toContain("import { useParams, useRouter }");
    });

    it("should import all required server actions", () => {
      const source = getComponentSource();
      expect(source).toContain("@/actions/watch/update-watch-time");
      expect(source).toContain("@/actions/watch/add-movie-view");
      expect(source).toContain("@/actions/watch/add-to-watchlist");
    });
  });

  describe("Conditional Rendering Logic", () => {
    it("should check hasMultiple for navigation buttons", () => {
      const source = getComponentSource();
      expect(source).toContain("{hasMultiple &&");
    });

    it("should check currentMovie position for button visibility", () => {
      const source = getComponentSource();
      expect(source).toContain("currentMovie === 0");
      expect(source).toContain("currentMovie > 0");
    });

    it("should check playlist length for button visibility", () => {
      const source = getComponentSource();
      expect(source).toContain("playlist.movies.length - 1");
    });

    it("should conditionally render video based on current.id", () => {
      const source = getComponentSource();
      expect(source).toContain("{current?.id &&");
    });
  });

  describe("Layout Structure", () => {
    it("should use relative positioning on container", () => {
      const source = getComponentSource();
      expect(source).toContain("relative");
    });

    it("should use absolute positioning on arrows", () => {
      const source = getComponentSource();
      expect(source).toContain("absolute");
    });

    it("should use flex layout for nav", () => {
      const source = getComponentSource();
      expect(source).toContain("flex flex-row");
    });

    it("should use flex layout for nav buttons", () => {
      const source = getComponentSource();
      expect(source).toMatch(/button[\s\S]*?flex flex-row items-center justify-center/);
    });
  });

  describe("Navigation Text Styling", () => {
    it("should style watching label with font-light", () => {
      const source = getComponentSource();
      expect(source).toContain("font-light");
    });

    it("should apply responsive text size", () => {
      const source = getComponentSource();
      expect(source).toContain("text-xl xl:text-3xl");
    });

    it("should apply font-bold to title", () => {
      const source = getComponentSource();
      expect(source).toContain("font-bold");
    });

    it("should apply text-white to title", () => {
      const source = getComponentSource();
      expect(source).toContain("text-white");
    });
  });

  describe("Button Interaction", () => {
    it("should apply cursor-pointer to buttons", () => {
      const source = getComponentSource();
      expect(source).toContain("cursor-pointer");
    });

    it("should apply cursor-pointer to back arrow", () => {
      const source = getComponentSource();
      expect(source).toMatch(/FaArrowLeft[\s\S]*?cursor-pointer/);
    });

    it("should have onClick handlers for all nav buttons", () => {
      const source = getComponentSource();
      expect(source).toMatch(/button[\s\S]*?onClick/);
    });
  });

  describe("Fragment Usage", () => {
    it("should use React fragment for middle navigation buttons", () => {
      const source = getComponentSource();
      expect(source).toContain("<>");
      expect(source).toContain("</>");
    });

    it("should wrap both left and right buttons in fragment", () => {
      const source = getComponentSource();
      expect(source).toMatch(/currentMovie > 0 && currentMovie < playlist\.movies\.length - 1[\s\S]*?<>/);
    });
  });

  describe("State Management", () => {
    it("should initialize currentMovie to 0", () => {
      const source = getComponentSource();
      expect(source).toContain("useState<number>(0)");
    });

    it("should use setCurrentMovie to update state", () => {
      const source = getComponentSource();
      expect(source).toContain("setCurrentMovie(newIndex)");
    });
  });

  describe("Video Event Handlers", () => {
    it("should define onTimeUpdate handler", () => {
      const source = getComponentSource();
      expect(source).toContain("onTimeUpdate=");
    });

    it("should define onEnded handler", () => {
      const source = getComponentSource();
      expect(source).toContain("onEnded={handleVideoEnded}");
    });

    it("should use arrow function in onTimeUpdate", () => {
      const source = getComponentSource();
      expect(source).toMatch(/onTimeUpdate={\(\) => {/);
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

    it("should define updateMovie with arrow function", () => {
      const source = getComponentSource();
      expect(source).toContain("const updateMovie = (dir: number) =>");
    });

    it("should define handleVideoEnded with arrow function", () => {
      const source = getComponentSource();
      expect(source).toContain("const handleVideoEnded = () =>");
    });
  });

  describe("Playlist Navigation Logic", () => {
    it("should add direction to current index", () => {
      const source = getComponentSource();
      expect(source).toContain("const newIndex = currentMovie + dir");
    });

    it("should check lower bound of index", () => {
      const source = getComponentSource();
      expect(source).toContain("newIndex >= 0");
    });

    it("should check upper bound of index", () => {
      const source = getComponentSource();
      expect(source).toContain("newIndex < playlist.movies.length");
    });

    it("should return early if no playlist movies", () => {
      const source = getComponentSource();
      expect(source).toContain("if (!playlist?.movies) return");
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

    it("should have responsive button sizes", () => {
      const source = getComponentSource();
      expect(source).toContain("h-10 w-12 xl:h-16 xl:w-20");
    });

    it("should have responsive arrow icon sizes", () => {
      const source = getComponentSource();
      expect(source).toContain("size={45}");
      expect(source).toContain("size={26}");
    });
  });

  describe("Video Configuration", () => {
    it("should use current movie id for video source", () => {
      const source = getComponentSource();
      expect(source).toContain("/api/video/${current.id}");
    });

    it("should use current movie thumbnail for poster", () => {
      const source = getComponentSource();
      expect(source).toContain("poster={current.thumbnailUrl}");
    });

    it("should include accessibility track", () => {
      const source = getComponentSource();
      expect(source).toContain("<track");
    });
  });
});
