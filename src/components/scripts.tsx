import { umamiTrackingId } from "@/lib/env/client"

const Scripts = () => {
  return (
    <>
      <script
        defer
        src="https://analytics.yopem.com/script.js"
        data-website-id={umamiTrackingId}
      ></script>
    </>
  )
}

export default Scripts
