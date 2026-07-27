import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockAddMovie = jest.fn();
const mockMutate = jest.fn();
const mockRefresh = jest.fn();
const mockResetUploadState = jest.fn();
const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();

const validMovie = {
  movieName: "Fresh Movie",
  movieDescripton: "A fresh description",
  movieActor: ["actor-1"],
  movieType: "Movie",
  movieGenre: "Drama",
  movieDuration: "01:30:00",
  movieVideo: "video-1",
  movieThumbnail: "",
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

jest.mock("swr", () => ({
  mutate: (...args: unknown[]) => mockMutate(...args),
}));

jest.mock("react-hot-toast", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

jest.mock("@/actions/add/add-movie", () => ({
  addMovie: (...args: unknown[]) => mockAddMovie(...args),
}));

jest.mock("@/hooks/useVideoThumbnailUpload", () => ({
  useVideoThumbnailUpload: () => ({
    videoFile: null,
    videoPreviewUrl: "",
    thumbnailUrl: "data:image/jpeg;base64,thumbnail",
    showThumbnailSelector: false,
    thumbnailOptions: [],
    uploadProgress: 0,
    isUploading: false,
    uploadedVideoPath: "",
    generatedVideoId: "",
    videoRef: { current: null },
    canvasRef: { current: null },
    handleVideoUpload: jest.fn(),
    uploadVideo: jest.fn(),
    createDataUri: jest.fn(),
    cancelUpload: jest.fn(),
    regenerateThumbnails: jest.fn(),
    selectThumbnail: jest.fn(),
    deselectThumbnail: jest.fn(),
    resetUploadState: mockResetUploadState,
  }),
}));

jest.mock("@/components/MovieFormFields", () => ({
  MovieFormFields: ({ form }: any) => {
    const values = form.watch();
    return (
      <div>
        <button type="button" onClick={() => form.reset(validMovie)}>
          Populate form
        </button>
        <span data-testid="movie-type">{values.movieType || "empty"}</span>
      </div>
    );
  },
}));

jest.mock("@/components/admin/InlineActorCreator", () => ({
  InlineActorCreator: () => null,
}));
jest.mock("@/components/ThumbnailPreview", () => ({
  ThumbnailPreview: () => null,
}));
jest.mock("@/components/ThumbnailSelector", () => ({
  ThumbnailSelector: () => null,
}));
jest.mock("@/components/VideoUploadField", () => ({
  VideoUploadField: () => null,
}));
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
jest.mock("@/components/ui/form", () => ({
  Form: ({ children }: any) => <>{children}</>,
  FormControl: ({ children }: any) => <>{children}</>,
  FormField: ({ render }: any) => render({
    field: { value: "", onChange: jest.fn() },
  }),
  FormItem: ({ children }: any) => <>{children}</>,
}));
jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

import { AddMovieForm } from "@/app/(protected)/add/_components/add-movie-form";

describe("AddMovieForm state after submission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ actors: [] }),
    });
  });

  test("clears the complete form and invalidates admin caches after success", async () => {
    mockAddMovie.mockResolvedValue({ success: "Movie added!" });

    render(<AddMovieForm />);
    fireEvent.click(screen.getByRole("button", { name: "Populate form" }));
    expect(screen.getByTestId("movie-type")).toHaveTextContent("Movie");

    fireEvent.click(screen.getByRole("button", { name: "Save Content" }));

    await waitFor(() => {
      expect(mockAddMovie).toHaveBeenCalledWith(
        validMovie,
        "data:image/jpeg;base64,thumbnail",
      );
      expect(screen.getByTestId("movie-type")).toHaveTextContent("empty");
    });
    expect(mockResetUploadState).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).toHaveBeenCalledWith("Movie added!");

    const cacheFilter = mockMutate.mock.calls[0][0];
    expect(cacheFilter("/api/movies/admin?page=1")).toBe(true);
    expect(cacheFilter("/api/admin/overview")).toBe(true);
    expect(cacheFilter("/api/admin/users")).toBe(false);
  });

  test("preserves entered values when the server rejects the submission", async () => {
    mockAddMovie.mockResolvedValue({ error: "Could not save" });

    render(<AddMovieForm />);
    fireEvent.click(screen.getByRole("button", { name: "Populate form" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Content" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Could not save");
    });
    expect(screen.getByTestId("movie-type")).toHaveTextContent("Movie");
    expect(mockResetUploadState).not.toHaveBeenCalled();
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
