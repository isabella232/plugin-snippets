async function setupPlugin({ config }) {
    try {
        const posthogRes = await fetch('http://localhost:8000/api/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.posthogApiKey}`
            }
        })
        const githubRes = await fetch(`https://api.github.com/repos/${config.ghOwner}/${config.ghRepo}`)
        if (posthogRes.status !== 200) {
            throw new Error('Invalid Personal API key')
        }
        console.log('GITHUB RES STATUS', githubRes.status)
        if (githubRes.status !== 200) {
            throw new Error('Invalid GitHub repo owner or name')
        }
    } catch {
        throw new Error('Invalid Personal API key')
    }
}

async function runEveryMinute({config}) {
    const annotationsResponse = await fetch('http://localhost:8000/api/annotation/?scope=organization&deleted=false', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${config.posthogApiKey}`
        }
    })
    const annotationsJson = await annotationsResponse.json()
    let annotations = new Set(annotationsJson.results.map(annotation => annotation.content))
    const ghTagsResponse = await fetch(`https://api.github.com/repos/${config.ghOwner}/${config.ghRepo}/tags`)
    const ghTagsJson = await ghTagsResponse.json()
    const newTags = ghTagsJson.map(tag => tag.name).filter(tagName => !annotations.has(tagName))
    for (let tag of newTags) {
        await fetch('http://localhost:8000/api/annotation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.posthogApiKey}`
            },
            body: JSON.stringify({
                "content": tag,
                "scope": "organization",
                "date_marker": new Date()
            })
        })
        posthog.capture(tag)
    }   

}
