import { LoadingSkeleton } from "@/components/dashboard/shared/loading-skeleton"
import { render } from "@/test-utils"

describe("LoadingSkeleton", () => {
  describe("card variant", () => {
    it("renders single card skeleton by default", () => {
      const { container } = render(<LoadingSkeleton />)
      const skeletons = container.querySelectorAll(".animate-pulse")
      expect(skeletons).toHaveLength(1)
    })

    it("renders multiple card skeletons when count is specified", () => {
      const { container } = render(<LoadingSkeleton count={3} />)
      const skeletons = container.querySelectorAll(".animate-pulse")
      expect(skeletons).toHaveLength(3)
    })

    it("applies custom className to card variant", () => {
      const { container } = render(<LoadingSkeleton className="custom-class" />)
      const skeleton = container.querySelector(".custom-class")
      expect(skeleton).toBeInTheDocument()
    })

    it("renders card structure with correct elements", () => {
      const { container } = render(<LoadingSkeleton variant="card" />)
      const skeleton = container.querySelector(".animate-pulse")
      expect(skeleton).toHaveClass("rounded-xl")
      expect(skeleton?.querySelectorAll(".rounded")).toHaveLength(2)
    })
  })

  describe("list variant", () => {
    it("renders single list skeleton", () => {
      const { container } = render(<LoadingSkeleton variant="list" />)
      const skeletons = container.querySelectorAll(".animate-pulse")
      expect(skeletons).toHaveLength(1)
    })

    it("renders multiple list skeletons when count is specified", () => {
      const { container } = render(<LoadingSkeleton variant="list" count={5} />)
      const skeletons = container.querySelectorAll(".animate-pulse")
      expect(skeletons).toHaveLength(5)
    })

    it("renders list structure with avatar and text", () => {
      const { container } = render(<LoadingSkeleton variant="list" />)
      const skeleton = container.querySelector(".animate-pulse")
      expect(skeleton?.querySelector(".rounded-full")).toBeInTheDocument()
    })

    it("applies custom className to list variant", () => {
      const { container } = render(
        <LoadingSkeleton variant="list" className="custom-list" />,
      )
      const skeleton = container.querySelector(".custom-list")
      expect(skeleton).toBeInTheDocument()
    })
  })

  describe("text variant", () => {
    it("renders single text skeleton", () => {
      const { container } = render(<LoadingSkeleton variant="text" />)
      const skeletons = container.querySelectorAll(".animate-pulse")
      expect(skeletons).toHaveLength(1)
    })

    it("renders multiple text skeletons when count is specified", () => {
      const { container } = render(<LoadingSkeleton variant="text" count={4} />)
      const skeletons = container.querySelectorAll(".animate-pulse")
      expect(skeletons).toHaveLength(4)
    })

    it("applies custom className to text variant", () => {
      const { container } = render(
        <LoadingSkeleton variant="text" className="custom-text" />,
      )
      const skeleton = container.querySelector(".custom-text")
      expect(skeleton).toBeInTheDocument()
    })

    it("renders text skeleton with correct height", () => {
      const { container } = render(<LoadingSkeleton variant="text" />)
      const skeleton = container.querySelector(".animate-pulse")
      expect(skeleton).toHaveClass("h-4")
    })
  })
})
