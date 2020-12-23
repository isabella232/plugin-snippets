async function runEveryDay({ config }) {
    const followersResponse = await fetchWithRetry(
        `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${config.twitterHandle}`
    )
    const followersResponseJson = await followersResponse.json()
    posthog.capture('twitter_followers', { follower_count: followersResponseJson[0].followers_count })
}

async function fetchWithRetry(url, options = {}, method = 'GET', isRetry = false) {
    try {
        const res = await fetch(url, { method: method, ...options })
        return res
    } catch {
        if (isRetry) {
            throw new Error(`${method} request to ${url} failed.`)
        }
        const res = await fetchWithRetry(url, options, (method = method), (isRetry = true))
        return res
    }
}
