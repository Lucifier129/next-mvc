export const initialState = {
	count: 0,
	stars: 0
}

// reducer
export const reducer = {
	stars: (state, stars) => (state.stars = stars),
	count: (state, n = 1) => (state.count += n)
}
