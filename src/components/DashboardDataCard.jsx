const DashboardDataCard = ({title, number}) => {

    return (
        <div>
            <div className="max-w-2xl flex flex-col align-center justify-center bg-white rounded-lg shadow-md dark:bg-white p-8 w-48 h-48">
                <h1 className="text-center">{number}</h1>
                <span className="mt-2 text-gray-600 w-full text-center dark:text-gray-300">{title}</span>
            </div>
        </div>
    );
}

export default DashboardDataCard;